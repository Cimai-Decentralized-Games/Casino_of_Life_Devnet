import { NextResponse } from 'next/server';
import { spawn } from 'child_process';

export async function POST(request: Request) {
  try {
    const { env, num_env, num_timesteps } = await request.json();

    return new Promise((resolve, reject) => {
      const pythonProcess = spawn('python', [
        'docker_emulator/custom_scripts/model_trainer.py',
        '--env', env,
        '--num_env', num_env.toString(),
        '--num_timesteps', num_timesteps.toString()
      ]);

      let modelPath = '';

      pythonProcess.stdout.on('data', (data) => {
        console.log(`stdout: ${data}`);
        if (data.toString().includes('Model saved to:')) {
          modelPath = data.toString().split('Model saved to:')[1].trim();
        }
      });

      pythonProcess.stderr.on('data', (data) => {
        console.error(`stderr: ${data}`);
      });

      pythonProcess.on('close', (code) => {
        console.log(`child process exited with code ${code}`);
        if (code === 0) {
          resolve(NextResponse.json({ 
            message: 'Agent trained successfully', 
            model_path: modelPath 
          }));
        } else {
          reject(NextResponse.json(
            { message: 'Failed to train agent', error: `Process exited with code ${code}` },
            { status: 500 }
          ));
        }
      });
    });
  } catch (error) {
    console.error('Error in /api/train-agent:', error);
    return NextResponse.json(
      { message: 'Failed to train agent', error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}