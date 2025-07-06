import React, { useState, useEffect } from 'react';
import mermaid from 'mermaid';

interface VisualDSARendererProps {
  algorithm: string;
  code: string;
  language: string;
  stepByStep?: boolean;
  onStepChange?: (step: number) => void;
}

interface CodeStep {
  line: number;
  description: string;
  variables: Record<string, any>;
  highlight: boolean;
}

const VisualDSARenderer: React.FC<VisualDSARendererProps> = ({
  algorithm,
  code,
  language,
  stepByStep = false,
  onStepChange
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [codeSteps, setCodeSteps] = useState<CodeStep[]>([]);
  const [diagramCode, setDiagramCode] = useState('');

  useEffect(() => {
    mermaid.initialize({ startOnLoad: true });
    generateCodeSteps();
    generateDiagram();
  }, [code, algorithm]);

  const generateCodeSteps = () => {
    // Parse code and create step-by-step execution
    const lines = code.split('\n');
    const steps: CodeStep[] = [];
    
    lines.forEach((line, index) => {
      if (line.trim() && !line.trim().startsWith('//')) {
        steps.push({
          line: index + 1,
          description: `Executing line ${index + 1}: ${line.trim()}`,
          variables: {},
          highlight: false
        });
      }
    });
    
    setCodeSteps(steps);
  };

  const generateDiagram = () => {
    // Generate mermaid diagram based on algorithm
    let diagram = '';
    
    switch (algorithm.toLowerCase()) {
      case 'bubble sort':
        diagram = `
          graph TD
            A[Start] --> B[Compare adjacent elements]
            B --> C{Is current > next?}
            C -->|Yes| D[Swap elements]
            C -->|No| E[Move to next pair]
            D --> E
            E --> F{More pairs?}
            F -->|Yes| B
            F -->|No| G[End]
        `;
        break;
      case 'binary search':
        diagram = `
          graph TD
            A[Start] --> B[Set low = 0, high = n-1]
            B --> C{low <= high?}
            C -->|No| D[Element not found]
            C -->|Yes| E[mid = low + high / 2]
            E --> F{arr[mid] == target?}
            F -->|Yes| G[Found at mid]
            F -->|No| H{arr[mid] > target?}
            H -->|Yes| I[high = mid - 1]
            H -->|No| J[low = mid + 1]
            I --> C
            J --> C
        `;
        break;
      default:
        diagram = `
          graph TD
            A[Algorithm: ${algorithm}] --> B[Step 1]
            B --> C[Step 2]
            C --> D[Step 3]
            D --> E[Result]
        `;
    }
    
    setDiagramCode(diagram);
  };

  const nextStep = () => {
    if (currentStep < codeSteps.length - 1) {
      const newStep = currentStep + 1;
      setCurrentStep(newStep);
      onStepChange?.(newStep);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      const newStep = currentStep - 1;
      setCurrentStep(newStep);
      onStepChange?.(newStep);
    }
  };

  const togglePlay = () => {
    setIsPlaying(!isPlaying);
  };

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying && currentStep < codeSteps.length - 1) {
      interval = setInterval(() => {
        nextStep();
      }, 2000);
    }
    return () => clearInterval(interval);
  }, [isPlaying, currentStep]);

  const highlightLine = (lineNumber: number) => {
    return lineNumber === codeSteps[currentStep]?.line;
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-semibold text-gray-800">
          Visual {algorithm} Explanation
        </h3>
        <div className="flex space-x-2">
          <button
            onClick={prevStep}
            disabled={currentStep === 0}
            className="px-3 py-1 bg-blue-500 text-white rounded disabled:opacity-50"
          >
            ← Prev
          </button>
          <button
            onClick={togglePlay}
            className="px-3 py-1 bg-green-500 text-white rounded"
          >
            {isPlaying ? '⏸️ Pause' : '▶️ Play'}
          </button>
          <button
            onClick={nextStep}
            disabled={currentStep === codeSteps.length - 1}
            className="px-3 py-1 bg-blue-500 text-white rounded disabled:opacity-50"
          >
            Next →
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Code Visualization */}
        <div className="bg-gray-900 rounded-lg p-4">
          <h4 className="text-white font-semibold mb-3">Code Execution</h4>
          <div className="text-sm font-mono text-gray-300">
            {code.split('\n').map((line, index) => (
              <div
                key={index}
                className={`py-1 px-2 rounded ${
                  highlightLine(index + 1)
                    ? 'bg-yellow-600 text-black'
                    : ''
                }`}
              >
                <span className="text-gray-500 mr-2">{index + 1}</span>
                {line}
              </div>
            ))}
          </div>
          <div className="mt-4 p-3 bg-blue-900 rounded">
            <p className="text-blue-200 text-sm">
              {codeSteps[currentStep]?.description || 'Ready to start'}
            </p>
          </div>
        </div>

        {/* Algorithm Flow Diagram */}
        <div className="bg-white border rounded-lg p-4">
          <h4 className="font-semibold mb-3">Algorithm Flow</h4>
          <div className="mermaid">
            {diagramCode}
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mt-4">
        <div className="flex justify-between text-sm text-gray-600 mb-2">
          <span>Step {currentStep + 1} of {codeSteps.length}</span>
          <span>{Math.round(((currentStep + 1) / codeSteps.length) * 100)}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{
              width: `${((currentStep + 1) / codeSteps.length) * 100}%`
            }}
          ></div>
        </div>
      </div>
    </div>
  );
};

export default VisualDSARenderer; 