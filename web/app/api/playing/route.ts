import { NextResponse } from 'next/server';
import { exec } from 'child_process';

export const config = {
  api: {
    responseLimit: false,
    bodyParser: {
      sizeLimit: '10mb'
    },
  },
}

export async function POST(request: Request) {
  try {
    const { env, state, num_env, num_timesteps, output_basedir, load_model, play, record, stream, stream_saved, video_path } = await request.json();

    const port = process.env.PORT || 3001;
    const hostUrl = `http://host.docker.internal:${port}`;

    let args = [
      `--env "${env}"`,
      state ? `--state "${state}"` : '',
      `--num_env ${num_env}`,
      `--num_timesteps ${num_timesteps}`,
      `--output_basedir "${output_basedir}"`,
      load_model ? `--load_model "${load_model}"` : '',
      play ? '--play' : '',
      record ? '--record' : '',
      stream ? '--stream' : '',
      stream_saved ? '--stream_saved' : '',
      video_path ? `--video_path "${video_path}"` : ''
    ].filter(Boolean).join(' ');

    const command = `docker exec -i mk2_container_v6 /bin/bash -c "export HOST_URL=${hostUrl} && source /opt/conda/etc/profile.d/conda.sh && conda activate retro_env && python /app/custom_scripts/model_trainer.py ${args}"`;

    const outputStream = new ReadableStream({
      start(controller) {
        const process = exec(command);

        process.stdout?.on('data', (data) => {
          const lines = data.toString().split('\n');
          lines.forEach((line: string) => {
            if (line.startsWith('data:image/jpeg;base64,')) {
              controller.enqueue(`data: ${line}\n\n`);
            } else if (line.trim()) {
              console.log(`Python output: ${line}`);
            }
          });
        });

        process.stderr?.on('data', (data) => {
          console.error(`Python error: ${data}`);
        });

        process.on('close', (code) => {
          console.log(`Python process exited with code ${code}`);
          controller.close();
        });
      }
    });

    return new Response(outputStream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    console.error('Error in /api/playing:', error);
    return NextResponse.json(
      { message: 'Failed to play agent', error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}