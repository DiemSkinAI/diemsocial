'use client'

import React from 'react';
import { CheckCircle, Circle, Loader } from 'lucide-react';

interface ProcessingStep {
  id: string;
  name: string;
  description: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
  duration?: number;
}

interface ProcessingProgressProps {
  steps: ProcessingStep[];
  currentStep?: string;
  isVisible: boolean;
}

export default function ProcessingProgress({ steps, currentStep, isVisible }: ProcessingProgressProps) {
  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-2xl p-8 max-w-md w-full mx-4">
        <div className="text-center mb-6">
          <h3 className="text-lg font-semibold text-white mb-2">Processing Your Kitchen</h3>
          <p className="text-sm text-gray-400">Deterministic texture replacement pipeline</p>
        </div>

        <div className="space-y-4">
          {steps.map((step, index) => {
            const isActive = currentStep === step.id;
            const isCompleted = step.status === 'completed';
            const isProcessing = step.status === 'processing' || isActive;
            const hasError = step.status === 'error';

            return (
              <div key={step.id} className="flex items-start gap-3">
                {/* Status Icon */}
                <div className="flex-shrink-0 mt-0.5">
                  {isCompleted ? (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  ) : isProcessing ? (
                    <Loader className="w-5 h-5 text-blue-500 animate-spin" />
                  ) : hasError ? (
                    <Circle className="w-5 h-5 text-red-500" />
                  ) : (
                    <Circle className="w-5 h-5 text-gray-500" />
                  )}
                </div>

                {/* Step Content */}
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <p className={`text-sm font-medium ${
                      isCompleted ? 'text-green-400' :
                      isProcessing ? 'text-blue-400' :
                      hasError ? 'text-red-400' :
                      'text-gray-400'
                    }`}>
                      {step.name}
                    </p>
                    {step.duration && isCompleted && (
                      <span className="text-xs text-gray-500">{step.duration}ms</span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{step.description}</p>
                  
                  {/* Progress bar for active step */}
                  {isProcessing && (
                    <div className="mt-2 w-full bg-gray-700 rounded-full h-1">
                      <div className="bg-blue-500 h-1 rounded-full animate-pulse" style={{width: '60%'}}></div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Overall progress indicator */}
        <div className="mt-6">
          <div className="flex items-center justify-between text-sm text-gray-400 mb-2">
            <span>Overall Progress</span>
            <span>{steps.filter(s => s.status === 'completed').length}/{steps.length}</span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-blue-500 to-green-500 h-2 rounded-full transition-all duration-500"
              style={{
                width: `${(steps.filter(s => s.status === 'completed').length / steps.length) * 100}%`
              }}
            ></div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Default processing steps for the deterministic pipeline
export const defaultProcessingSteps: ProcessingStep[] = [
  {
    id: 'segmentation',
    name: 'Countertop Detection',
    description: 'Identifying countertop surfaces in your kitchen',
    status: 'pending'
  },
  {
    id: 'texture-processing',
    name: 'Material Analysis',
    description: 'Processing your inspiration material sample',
    status: 'pending'
  },
  {
    id: 'perspective',
    name: 'Geometry Mapping',
    description: 'Detecting countertop perspective and angles',
    status: 'pending'
  },
  {
    id: 'lighting',
    name: 'Lighting Extraction',
    description: 'Analyzing original scene lighting',
    status: 'pending'
  },
  {
    id: 'warping',
    name: 'Texture Warping',
    description: 'Fitting material to countertop geometry',
    status: 'pending'
  },
  {
    id: 'relighting',
    name: 'Realistic Lighting',
    description: 'Applying original lighting to new material',
    status: 'pending'
  },
  {
    id: 'blending',
    name: 'Seamless Integration',
    description: 'Blending new texture with original image',
    status: 'pending'
  }
];