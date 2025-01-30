import { NextRequest, NextResponse } from 'next/server';
import { generateMetadataUri, storeModel } from '../../lib/nftService.server';
import { verifyModel } from '../../../utils/modelValidation';
import type { ModelData } from '../../../utils/modelValidation';

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const action = formData.get('action') as string;
  
  try {
    switch (action) {
      case 'store': {
        const modelDataJson = formData.get('modelData') as string;
        const modelBuffer = formData.get('modelBuffer') as Blob;
        if (!modelDataJson || !modelBuffer) {
          return NextResponse.json({ error: 'modelData and modelBuffer are required' }, { status: 400 });
        }

        const modelData = JSON.parse(modelDataJson) as ModelData;
        const arrayBuffer = await modelBuffer.arrayBuffer();
        const modelId = await storeModel(modelData, arrayBuffer);
        
        return NextResponse.json({ key: modelId });
      }

      case 'validate': {
        const modelId = formData.get('modelId') as string;
        if (!modelId) {
          return NextResponse.json({ error: 'modelId is required' }, { status: 400 });
        }

        const validationResult = await verifyModel(modelId);
        return NextResponse.json({ result: validationResult });
      }

      case 'metadata': {
        const modelDataJson = formData.get('modelData') as string;
        const image = formData.get('image') as File | null;
        const modelId = formData.get('modelId') as string;
        
        if (!modelDataJson || !modelId) {
          return NextResponse.json({ error: 'modelData and modelId are required' }, { status: 400 });
        }

        const modelData = JSON.parse(modelDataJson) as ModelData;
        const result = await generateMetadataUri(modelData, image, modelId);
        
        return NextResponse.json(result);
      }

      default:
        return NextResponse.json({ 
          error: 'Invalid action',
          validActions: ['store', 'validate', 'metadata']
        }, { status: 400 });
    }
  } catch (error) {
    console.error('Model processing error:', error);
    return NextResponse.json({ 
      error: 'Operation failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
