import { ModelData } from '../../utils/modelValidation';

export async function generateMetadataUri(
  modelData: ModelData, 
  image: File | null, 
  modelId: string
): Promise<{ uri: string; modelHash: number[]; modelId: string }> {
  const formData = new FormData();
  formData.append('operation', 'metadata');
  formData.append('modelData', JSON.stringify({ ...modelData, id: modelId }));
  if (image) formData.append('image', image);

  const response = await fetch('https://cimai.biz/modelValidate.php', {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`Failed to generate metadata: ${response.statusText}`);
  }

  return response.json();
}

export async function generateNftMetadataUri(
    modelData: ModelData,
    image: File | null,
    model: File | null
  ): Promise<string> {
    const { uri } = await generateMetadataUri(modelData, image, modelData.id);
    return uri;
  }

export async function storeModel(
  modelData: ModelData, 
  modelBuffer: ArrayBuffer
): Promise<string> {
  const formData = new FormData();
  formData.append('operation', 'store');
  formData.append('modelData', JSON.stringify(modelData));
  formData.append('modelBuffer', new Blob([modelBuffer]));

  const response = await fetch('https://cimai.biz/modelValidate.php', {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`Failed to store model: ${response.statusText}`);
  }

  const { modelId } = await response.json();
  return modelId;
}