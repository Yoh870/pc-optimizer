import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import util from 'util';
import path from 'path';

const execAsync = util.promisify(exec);

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const action = searchParams.get('action');

  try {
    if (action === 'drives') {
      const { stdout } = await execAsync(
        'powershell -Command "Get-Volume | Select-Object DriveLetter, FileSystemLabel, Size, SizeRemaining | ConvertTo-Json"'
      );
      try {
        let raw = JSON.parse(stdout.trim() || '[]');
        if (!Array.isArray(raw)) raw = [raw];
        const drives = raw.map((d: any) => ({
          DriveLetter: d.DriveLetter || '?',
          FileSystemLabel: d.FileSystemLabel || 'Local Disk',
          SizeGB: d.Size ? (d.Size / 1073741824).toFixed(2) : '0.00',
          FreeGB: d.SizeRemaining ? (d.SizeRemaining / 1073741824).toFixed(2) : '0.00'
        })).filter((d: any) => Number(d.SizeGB) > 0);
        return NextResponse.json({ drives });
      } catch {
        return NextResponse.json({ drives: [], raw: stdout });
      }
    }

    if (action === 'processes') {
      const { stdout } = await execAsync(
        'powershell -Command "Get-Process | Sort-Object WorkingSet -Descending | Select-Object -First 10 Name, WorkingSet | ConvertTo-Json"'
      );
      try {
        let raw = JSON.parse(stdout.trim() || '[]');
        if (!Array.isArray(raw)) raw = [raw];
        const processes = raw.map((p: any) => ({
          Name: p.Name,
          MemoryMB: p.WorkingSet ? Math.round(p.WorkingSet / 1048576).toLocaleString() : '0'
        }));
        return NextResponse.json({ processes });
      } catch {
        return NextResponse.json({ processes: [], raw: stdout });
      }
    }

    return NextResponse.json({ error: 'Invalid GET action' }, { status: 400 });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { action } = await req.json();

    if (action === 'flush-dns') {
      const { stdout, stderr } = await execAsync('ipconfig /flushdns');
      return NextResponse.json({ success: true, message: 'DNS Cache successfully flushed!', output: stdout || stderr });
    }

    if (action === 'clean-temp') {
      const scriptPath = path.join(process.cwd(), 'clean-temp.ps1');
      const { stdout } = await execAsync(`powershell -ExecutionPolicy Bypass -File "${scriptPath}"`);
      let result = { DeletedFiles: 0, FreedBytes: 0 };
      try {
        result = JSON.parse(stdout.trim());
      } catch {}
      const freedMB = (result.FreedBytes / 1048576).toFixed(2);
      return NextResponse.json({
        success: true,
        message: `Successfully cleaned temp files! Deleted ~${result.DeletedFiles} items, freeing ${freedMB} MB.`,
        details: { DeletedFiles: result.DeletedFiles, FreedMB: freedMB }
      });
    }

    return NextResponse.json({ error: 'Invalid POST action' }, { status: 400 });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
