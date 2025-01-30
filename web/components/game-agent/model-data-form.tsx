import React, { useState } from 'react';
import { ModelData } from '../../utils/modelValidation';
import { FaImage, FaSave, FaExclamationTriangle } from 'react-icons/fa';

interface ModelDataFormProps {
  initialData?: ModelData;
  onSubmit: (modelData: ModelData) => Promise<void>;
  onImageUpload: (file: File) => void;
  uploadedImage: File | null;
}

interface ModelFormErrors extends Partial<Record<keyof ModelData, string>> {
  image?: string;
  submit?: string;
}

export function ModelDataForm({
  initialData, 
  onSubmit, 
  onImageUpload, 
  uploadedImage 
}: ModelDataFormProps) {
  const [formData, setFormData] = useState<ModelData>(initialData || {
    id: `model_${Date.now()}_${Math.random().toString(36).substring(7)}`,
    name: '',
    description: '',
    version: '',
    modelType: '',
    architecture: {
      type: '',
      layers: 0,
      hiddenSize: 0,
      attentionHeads: 0
    },
    training: {
      method: '',
      dataset: '',
      datasetSize: 0,
      epochs: 0,
      batchSize: 0,
      optimizer: '',
      learningRate: 0
    },
    performance: {
      accuracy: 0,
      loss: 0,
      f1Score: 0
    }
  });

  const [errors, setErrors] = useState<ModelFormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    const keys = name.split('.');
    
    setFormData(prev => {
      const newData = { ...prev };
      let current: any = newData;
      
      for (let i = 0; i < keys.length - 1; i++) {
        current = current[keys[i]];
      }
      
      current[keys[keys.length - 1]] = e.target.type === 'number' ? parseFloat(value) : value;
      return newData;
    });

    // Clear error when field is modified
    if (errors[name as keyof ModelData]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onImageUpload(e.target.files[0]);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: ModelFormErrors = {};

    // Basic validation rules
    if (!formData.name) newErrors.name = 'Model name is required';
    if (!formData.description) newErrors.description = 'Description is required';
    if (!formData.version) newErrors.version = 'Version is required';
    if (!formData.modelType) newErrors.modelType = 'Model type is required';
    
    // Architecture validation
    if (!formData.architecture.type) newErrors['architecture.type'] = 'Architecture type is required';
    if (formData.architecture.layers <= 0) newErrors['architecture.layers'] = 'Layers must be greater than 0';
    
    // Training validation
    if (!formData.training.method) newErrors['training.method'] = 'Training method is required';
    if (!formData.training.dataset) newErrors['training.dataset'] = 'Dataset is required';
    if (formData.training.learningRate <= 0) newErrors['training.learningRate'] = 'Learning rate must be greater than 0';

    // Performance validation
    if (formData.performance.accuracy < 0 || formData.performance.accuracy > 1) {
      newErrors['performance.accuracy'] = 'Accuracy must be between 0 and 1';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    if (!uploadedImage) {
      setErrors(prev => ({ ...prev, image: 'NFT image is required' }));
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(formData);
    } catch (error) {
      setErrors(prev => ({ 
        ...prev, 
        submit: `Submission failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      }));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-base-200 p-6 rounded-lg shadow-lg flex flex-col h-[80vh]">
      <h2 className="text-2xl font-semibold mb-4">Model Data Input</h2>
      <div className="overflow-y-auto flex-grow">
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="form-control">
              <label className="label">
                <span className="label-text">Model Name</span>
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className={`input input-bordered w-full ${errors.name ? 'input-error' : ''}`}
                placeholder="e.g., ImageClassifier_v2"
              />
              <label className="label">
                <span className="label-text-alt">Give your model a unique, descriptive name</span>
              </label>
              {errors.name && (
                <label className="label">
                  <span className="label-text-alt text-error flex items-center">
                    <FaExclamationTriangle className="mr-1" /> {errors.name}
                  </span>
                </label>
              )}
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text">Version</span>
              </label>
              <input
                type="text"
                name="version"
                value={formData.version}
                onChange={handleInputChange}
                className={`input input-bordered w-full ${errors.version ? 'input-error' : ''}`}
                placeholder="e.g., 1.0.0"
              />
              <label className="label">
                <span className="label-text-alt">Semantic versioning (MAJOR.MINOR.PATCH)</span>
              </label>
              {errors.version && (
                <label className="label">
                  <span className="label-text-alt text-error flex items-center">
                    <FaExclamationTriangle className="mr-1" /> {errors.version}
                  </span>
                </label>
              )}
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text">Model Type</span>
              </label>
              <input
                type="text"
                name="modelType"
                value={formData.modelType}
                onChange={handleInputChange}
                className={`input input-bordered w-full ${errors.modelType ? 'input-error' : ''}`}
                placeholder="e.g., Transformer, CNN, RNN"
              />
              <label className="label">
                <span className="label-text-alt">The primary architecture type of your model</span>
              </label>
              {errors.modelType && (
                <label className="label">
                  <span className="label-text-alt text-error flex items-center">
                    <FaExclamationTriangle className="mr-1" /> {errors.modelType}
                  </span>
                </label>
              )}
            </div>

            <div className="form-control md:col-span-2">
              <label className="label">
                <span className="label-text">Description</span>
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                className={`textarea textarea-bordered h-24 ${errors.description ? 'textarea-error' : ''}`}
                placeholder="Describe your model's purpose, capabilities, and unique features"
              />
              <label className="label">
                <span className="label-text-alt">Provide a detailed description of what your model does</span>
              </label>
              {errors.description && (
                <label className="label">
                  <span className="label-text-alt text-error flex items-center">
                    <FaExclamationTriangle className="mr-1" /> {errors.description}
                  </span>
                </label>
              )}
            </div>
          </div>

          {/* Architecture Section */}
          <div className="divider">Architecture Details</div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="form-control">
              <label className="label">
                <span className="label-text">Architecture Type</span>
              </label>
              <input
                type="text"
                name="architecture.type"
                value={formData.architecture.type}
                onChange={handleInputChange}
                className={`input input-bordered w-full ${errors['architecture.type'] ? 'input-error' : ''}`}
                placeholder="e.g., LSTM, Transformer, ResNet"
              />
              <label className="label">
                <span className="label-text-alt">Specific architecture implementation used</span>
              </label>
              {errors['architecture.type'] && (
                <label className="label">
                  <span className="label-text-alt text-error flex items-center">
                    <FaExclamationTriangle className="mr-1" /> {errors['architecture.type']}
                  </span>
                </label>
              )}
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text">Number of Layers</span>
              </label>
              <input
                type="number"
                name="architecture.layers"
                value={formData.architecture.layers}
                onChange={handleInputChange}
                className={`input input-bordered w-full ${errors['architecture.layers'] ? 'input-error' : ''}`}
                placeholder="e.g., 12"
                min="1"
              />
              <label className="label">
                <span className="label-text-alt">Total number of layers in your model</span>
              </label>
              {errors['architecture.layers'] && (
                <label className="label">
                  <span className="label-text-alt text-error flex items-center">
                    <FaExclamationTriangle className="mr-1" /> {errors['architecture.layers']}
                  </span>
                </label>
              )}
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text">Hidden Size</span>
              </label>
              <input
                type="number"
                name="architecture.hiddenSize"
                value={formData.architecture.hiddenSize}
                onChange={handleInputChange}
                className={`input input-bordered w-full ${errors['architecture.hiddenSize'] ? 'input-error' : ''}`}
                placeholder="e.g., 768"
                min="1"
              />
              <label className="label">
                <span className="label-text-alt">Dimension of hidden layers</span>
              </label>
              {errors['architecture.hiddenSize'] && (
                <label className="label">
                  <span className="label-text-alt text-error flex items-center">
                    <FaExclamationTriangle className="mr-1" /> {errors['architecture.hiddenSize']}
                  </span>
                </label>
              )}
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text">Attention Heads</span>
              </label>
              <input
                type="number"
                name="architecture.attentionHeads"
                value={formData.architecture.attentionHeads}
                onChange={handleInputChange}
                className={`input input-bordered w-full ${errors['architecture.attentionHeads'] ? 'input-error' : ''}`}
                placeholder="e.g., 12"
                min="0"
              />
              <label className="label">
                <span className="label-text-alt">Number of attention heads (if applicable)</span>
              </label>
              {errors['architecture.attentionHeads'] && (
                <label className="label">
                  <span className="label-text-alt text-error flex items-center">
                    <FaExclamationTriangle className="mr-1" /> {errors['architecture.attentionHeads']}
                  </span>
                </label>
              )}
            </div>
          </div>

          {/* Training Section */}
          <div className="divider">Training Details</div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="form-control">
              <label className="label">
                <span className="label-text">Training Method</span>
              </label>
              <input
                type="text"
                name="training.method"
                value={formData.training.method}
                onChange={handleInputChange}
                className={`input input-bordered w-full ${errors['training.method'] ? 'input-error' : ''}`}
                placeholder="e.g., Supervised, Self-supervised"
              />
              <label className="label">
                <span className="label-text-alt">Method used to train the model</span>
              </label>
              {errors['training.method'] && (
                <label className="label">
                  <span className="label-text-alt text-error flex items-center">
                    <FaExclamationTriangle className="mr-1" /> {errors['training.method']}
                  </span>
                </label>
              )}
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text">Dataset</span>
              </label>
              <input
                type="text"
                name="training.dataset"
                value={formData.training.dataset}
                onChange={handleInputChange}
                className={`input input-bordered w-full ${errors['training.dataset'] ? 'input-error' : ''}`}
                placeholder="e.g., ImageNet, Custom Dataset"
              />
              <label className="label">
                <span className="label-text-alt">Dataset used for training</span>
              </label>
              {errors['training.dataset'] && (
                <label className="label">
                  <span className="label-text-alt text-error flex items-center">
                    <FaExclamationTriangle className="mr-1" /> {errors['training.dataset']}
                  </span>
                </label>
              )}
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text">Dataset Size</span>
              </label>
              <input
                type="number"
                name="training.datasetSize"
                value={formData.training.datasetSize}
                onChange={handleInputChange}
                className={`input input-bordered w-full ${errors['training.datasetSize'] ? 'input-error' : ''}`}
                placeholder="e.g., 1000000"
                min="1"
              />
              <label className="label">
                <span className="label-text-alt">Number of samples in training dataset</span>
              </label>
              {errors['training.datasetSize'] && (
                <label className="label">
                  <span className="label-text-alt text-error flex items-center">
                    <FaExclamationTriangle className="mr-1" /> {errors['training.datasetSize']}
                  </span>
                </label>
              )}
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text">Epochs</span>
              </label>
              <input
                type="number"
                name="training.epochs"
                value={formData.training.epochs}
                onChange={handleInputChange}
                className={`input input-bordered w-full ${errors['training.epochs'] ? 'input-error' : ''}`}
                placeholder="e.g., 100"
                min="1"
              />
              <label className="label">
                <span className="label-text-alt">Number of training epochs</span>
              </label>
              {errors['training.epochs'] && (
                <label className="label">
                  <span className="label-text-alt text-error flex items-center">
                    <FaExclamationTriangle className="mr-1" /> {errors['training.epochs']}
                  </span>
                </label>
              )}
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text">Batch Size</span>
              </label>
              <input
                type="number"
                name="training.batchSize"
                value={formData.training.batchSize}
                onChange={handleInputChange}
                className={`input input-bordered w-full ${errors['training.batchSize'] ? 'input-error' : ''}`}
                placeholder="e.g., 32"
                min="1"
              />
              <label className="label">
                <span className="label-text-alt">Training batch size</span>
              </label>
              {errors['training.batchSize'] && (
                <label className="label">
                  <span className="label-text-alt text-error flex items-center">
                    <FaExclamationTriangle className="mr-1" /> {errors['training.batchSize']}
                  </span>
                </label>
              )}
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text">Optimizer</span>
              </label>
              <input
                type="text"
                name="training.optimizer"
                value={formData.training.optimizer}
                onChange={handleInputChange}
                className={`input input-bordered w-full ${errors['training.optimizer'] ? 'input-error' : ''}`}
                placeholder="e.g., Adam, SGD"
              />
              <label className="label">
                <span className="label-text-alt">Optimization algorithm used</span>
              </label>
              {errors['training.optimizer'] && (
                <label className="label">
                  <span className="label-text-alt text-error flex items-center">
                    <FaExclamationTriangle className="mr-1" /> {errors['training.optimizer']}
                  </span>
                </label>
              )}
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text">Learning Rate</span>
              </label>
              <input
                type="number"
                name="training.learningRate"
                value={formData.training.learningRate}
                onChange={handleInputChange}
                className={`input input-bordered w-full ${errors['training.learningRate'] ? 'input-error' : ''}`}
                placeholder="e.g., 0.001"
                step="0.0001"
                min="0"
              />
              <label className="label">
                <span className="label-text-alt">Initial learning rate</span>
              </label>
              {errors['training.learningRate'] && (
                <label className="label">
                  <span className="label-text-alt text-error flex items-center">
                    <FaExclamationTriangle className="mr-1" /> {errors['training.learningRate']}
                  </span>
                </label>
              )}
            </div>
          </div>

          {/* Performance Section */}
          <div className="divider">Performance Metrics</div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="form-control">
              <label className="label">
                <span className="label-text">Accuracy</span>
              </label>
              <input
                type="number"
                name="performance.accuracy"
                value={formData.performance.accuracy}
                onChange={handleInputChange}
                className={`input input-bordered w-full ${errors['performance.accuracy'] ? 'input-error' : ''}`}
                placeholder="e.g., 0.95"
                step="0.01"
                min="0"
                max="1"
              />
              <label className="label">
                <span className="label-text-alt">Model accuracy (0-1)</span>
              </label>
              {errors['performance.accuracy'] && (
                <label className="label">
                  <span className="label-text-alt text-error flex items-center">
                    <FaExclamationTriangle className="mr-1" /> {errors['performance.accuracy']}
                  </span>
                </label>
              )}
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text">Loss</span>
              </label>
              <input
                type="number"
                name="performance.loss"
                value={formData.performance.loss}
                onChange={handleInputChange}
                className={`input input-bordered w-full ${errors['performance.loss'] ? 'input-error' : ''}`}
                placeholder="e.g., 0.05"
                step="0.01"
                min="0"
              />
              <label className="label">
                <span className="label-text-alt">Final training loss</span>
              </label>
              {errors['performance.loss'] && (
                <label className="label">
                  <span className="label-text-alt text-error flex items-center">
                    <FaExclamationTriangle className="mr-1" /> {errors['performance.loss']}
                  </span>
                </label>
              )}
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text">F1 Score</span>
              </label>
              <input
                type="number"
                name="performance.f1Score"
                value={formData.performance.f1Score}
                onChange={handleInputChange}
                className={`input input-bordered w-full ${errors['performance.f1Score'] ? 'input-error' : ''}`}
                placeholder="e.g., 0.92"
                step="0.01"
                min="0"
                max="1"
              />
              <label className="label">
                <span className="label-text-alt">F1 score (0-1)</span>
              </label>
              {errors['performance.f1Score'] && (
                <label className="label">
                  <span className="label-text-alt text-error flex items-center">
                    <FaExclamationTriangle className="mr-1" /> {errors['performance.f1Score']}
                  </span>
                </label>
              )}
            </div>
          </div>

          {/* Image Upload Section */}
          <div className="divider">NFT Image</div>
          <div className="form-control">
            <label className="label">
              <span className="label-text flex items-center">
                <FaImage className="mr-2" /> NFT Image
              </span>
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className={`file-input file-input-bordered w-full ${errors.image ? 'input-error' : ''}`}
            />
            <label className="label">
              <span className="label-text-alt">Upload an image to represent your model as an NFT</span>
            </label>
            {uploadedImage && (
              <p className="text-success text-sm mt-1">
                Image uploaded: {uploadedImage.name}
              </p>
            )}
            {errors.image && (
              <label className="label">
                <span className="label-text-alt text-error flex items-center">
                  <FaExclamationTriangle className="mr-1" /> {errors.image}
                </span>
              </label>
            )}
          </div>

          {/* Submit Button */}
          <div className="mt-6">
            <button
              type="submit"
              disabled={isSubmitting}
              className={`btn btn-primary w-full ${isSubmitting ? 'loading' : ''}`}
            >
              <FaSave className="mr-2" />
              {isSubmitting ? 'Saving...' : 'Save Model Data'}
            </button>
          </div>

          {/* General Error Message */}
          {errors.submit && (
            <div className="alert alert-error mt-4">
              <FaExclamationTriangle className="mr-2" />
              {errors.submit}
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
