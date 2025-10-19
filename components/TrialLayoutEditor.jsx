import React, { useState } from 'react';
import { Plus, Minus, Shuffle, Save, Settings } from 'lucide-react';

const TrialLayoutEditor = () => {
  // Treatment colors (up to 17 treatments)
  const treatmentColors = {
    'A': '#FF6B6B',
    'B': '#4ECDC4', 
    'C': '#45B7D1',
    'D': '#FFA07A',
    'E': '#95E1D3',
    'F': '#F38181',
    'G': '#AA96DA',
    'H': '#FCBAD3',
    'I': '#FFD93D',
    'J': '#6BCF7F',
    'K': '#FF85A2',
    'L': '#5DADE2',
    'M': '#F8B739',
    'N': '#A78BFA',
    'O': '#34D399',
    'P': '#FB923C',
    'Q': '#EC4899'
  };

  // Trial configuration (will come from parent component in real app)
  const [numTreatments, setNumTreatments] = useState(5);
  const [numBlocks, setNumBlocks] = useState(4);
  const [showConfig, setShowConfig] = useState(true);

  // Generate treatment letters based on count
  const getTreatments = (count) => {
    return Array.from({ length: count }, (_, i) => String.fromCharCode(65 + i));
  };

  // Generate RCBD layout - each row is one block with all treatments
  const generateRCBDLayout = (treatments, blocks) => {
    const layout = [];
    
    for (let block = 1; block <= blocks; block++) {
      // Each row/block gets all treatments, shuffled
      const blockTreatments = [...treatments].sort(() => Math.random() - 0.5);
      const blockRow = blockTreatments.map((treatment, idx) => ({
        id: `plot-b${block}-p${idx}`,
        treatment,
        block,
        position: idx,
        isBlank: false
      }));
      layout.push(blockRow);
    }
    
    return layout;
  };

  const [layout, setLayout] = useState(() => 
    generateRCBDLayout(getTreatments(numTreatments), numBlocks)
  );
  const [draggedItem, setDraggedItem] = useState(null);
  const [compassRotation, setCompassRotation] = useState(0); // 0 = North up

  // Generate new trial
  const generateNewTrial = () => {
    const treatments = getTreatments(numTreatments);
    setLayout(generateRCBDLayout(treatments, numBlocks));
    setShowConfig(false);
  };

  // Randomize entire layout (randomize each block independently)
  const randomizeAllBlocks = () => {
    const treatments = getTreatments(numTreatments);
    setLayout(generateRCBDLayout(treatments, numBlocks));
  };

  // Randomize single block/row
  const randomizeBlock = (blockIdx) => {
    const newLayout = [...layout];
    const treatments = layout[blockIdx]
      .filter(plot => !plot.isBlank)
      .map(plot => plot.treatment);
    
    const shuffled = [...treatments].sort(() => Math.random() - 0.5);
    let treatmentIdx = 0;
    
    newLayout[blockIdx] = newLayout[blockIdx].map(plot => {
      if (plot.isBlank) return plot;
      return {
        ...plot,
        treatment: shuffled[treatmentIdx++]
      };
    });
    
    setLayout(newLayout);
  };

  // Add blank to specific position in block
  const addBlankToBlock = (blockIdx, position) => {
    const newLayout = [...layout];
    const blank = {
      id: `blank-b${blockIdx + 1}-${Date.now()}`,
      isBlank: true,
      block: blockIdx + 1,
      position
    };
    newLayout[blockIdx].splice(position, 0, blank);
    setLayout(newLayout);
  };

  // Remove blank
  const removeBlank = (blockIdx, plotIdx) => {
    const newLayout = [...layout];
    newLayout[blockIdx] = newLayout[blockIdx].filter((_, idx) => idx !== plotIdx);
    setLayout(newLayout);
  };

  // Drag handlers (only allow swapping within same row/block)
  const handleDragStart = (e, blockIdx, plotIdx) => {
    setDraggedItem({ blockIdx, plotIdx });
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e, targetBlockIdx, targetPlotIdx) => {
    e.preventDefault();
    if (!draggedItem) return;

    // Only allow swapping within same block/row
    if (draggedItem.blockIdx !== targetBlockIdx) {
      alert('Cannot move plots between blocks! Drag within the same row only.');
      setDraggedItem(null);
      return;
    }

    const newLayout = [...layout];
    const block = [...newLayout[targetBlockIdx]];
    const temp = block[draggedItem.plotIdx];
    block[draggedItem.plotIdx] = block[targetPlotIdx];
    block[targetPlotIdx] = temp;
    newLayout[targetBlockIdx] = block;

    setLayout(newLayout);
    setDraggedItem(null);
  };

  // Export layout
  const exportLayout = () => {
    const data = {
      numTreatments,
      numBlocks,
      compassRotation,
      layout: layout.map(block => 
        block.map(plot => ({
          treatment: plot.treatment,
          block: plot.block,
          isBlank: plot.isBlank
        }))
      )
    };
    console.log('Trial Layout:', data);
    alert('Layout exported! Check console. Ready to integrate with trial-data-tool.');
  };

  // Compass controls
  const rotateCompass = (degrees) => {
    setCompassRotation((prev) => (prev + degrees + 360) % 360);
  };

  const treatments = getTreatments(numTreatments);

  if (showConfig) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-8 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full">
          <div className="flex items-center gap-3 mb-6">
            <Settings className="text-green-600" size={32} />
            <h1 className="text-3xl font-bold text-gray-800">Trial Setup</h1>
          </div>
          
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Number of Treatments
              </label>
              <input
                type="number"
                min="2"
                max="17"
                value={numTreatments}
                onChange={(e) => setNumTreatments(Math.max(2, Math.min(17, parseInt(e.target.value) || 2)))}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-green-500 focus:outline-none text-lg"
              />
              <p className="text-sm text-gray-500 mt-1">
                Treatments: {getTreatments(numTreatments).join(', ')}
              </p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Number of Blocks (Replicates)
              </label>
              <input
                type="number"
                min="2"
                max="10"
                value={numBlocks}
                onChange={(e) => setNumBlocks(Math.max(2, Math.min(10, parseInt(e.target.value) || 2)))}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-green-500 focus:outline-none text-lg"
              />
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                <strong>RCBD Layout:</strong> Each block (row) will contain all {numTreatments} treatments, randomized independently.
              </p>
            </div>

            <button
              onClick={generateNewTrial}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-lg transition"
            >
              Generate Trial Layout
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 mb-2">
                Field Trial Layout
              </h1>
              <p className="text-gray-600">
                {numTreatments} Treatments × {numBlocks} Blocks = {numTreatments * numBlocks} Total Plots
              </p>
            </div>
            <button
              onClick={() => setShowConfig(true)}
              className="flex items-center gap-2 bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition"
            >
              <Settings size={20} />
              New Trial
            </button>
          </div>
        </div>

        {/* Controls */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex flex-wrap gap-3">
            <button
              onClick={randomizeAllBlocks}
              className="flex items-center gap-2 bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-lg transition"
            >
              <Shuffle size={20} />
              Randomize All Blocks
            </button>
            <button
              onClick={exportLayout}
              className="flex items-center gap-2 bg-gray-700 hover:bg-gray-800 text-white px-4 py-2 rounded-lg transition ml-auto"
            >
              <Save size={20} />
              Save Layout
            </button>
          </div>
        </div>

        {/* Legend */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h3 className="font-semibold mb-3 text-gray-700">Treatment Legend:</h3>
          <div className="flex flex-wrap gap-3">
            {treatments.map(treatment => (
              <div key={treatment} className="flex items-center gap-2">
                <div 
                  className="w-8 h-8 rounded flex items-center justify-center text-white font-bold shadow"
                  style={{ backgroundColor: treatmentColors[treatment] }}
                >
                  {treatment}
                </div>
                <span className="text-gray-700">Treatment {treatment}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Field Layout - Each row is one block */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-700">
                Field Map (Each row = 1 Block)
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                Plots resize to fit screen width
              </p>
            </div>
            
            {/* Compass Control */}
            <div className="flex flex-col items-center gap-2">
              <div className="text-xs font-semibold text-gray-600">ORIENTATION</div>
              
              {/* Compass Display */}
              <div className="relative w-24 h-24 bg-gradient-to-br from-blue-50 to-blue-100 rounded-full shadow-lg border-4 border-blue-300">
                {/* Compass Rose */}
                <div 
                  className="absolute inset-0 flex items-center justify-center"
                  style={{ transform: `rotate(${compassRotation}deg)` }}
                >
                  {/* North Arrow */}
                  <div className="absolute top-1 left-1/2 -translate-x-1/2">
                    <div className="w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-b-[16px] border-b-red-600"></div>
                    <div className="text-xs font-bold text-red-600 text-center mt-0.5">N</div>
                  </div>
                  
                  {/* South */}
                  <div className="absolute bottom-1 left-1/2 -translate-x-1/2">
                    <div className="text-xs font-semibold text-gray-600 mb-0.5">S</div>
                    <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[12px] border-t-gray-600"></div>
                  </div>
                  
                  {/* East */}
                  <div className="absolute right-1 top-1/2 -translate-y-1/2">
                    <div className="text-xs font-semibold text-gray-600">E</div>
                  </div>
                  
                  {/* West */}
                  <div className="absolute left-1 top-1/2 -translate-y-1/2">
                    <div className="text-xs font-semibold text-gray-600">W</div>
                  </div>
                  
                  {/* Center Dot */}
                  <div className="w-2 h-2 bg-gray-800 rounded-full"></div>
                </div>
              </div>
              
              {/* Rotation Display */}
              <div className="text-sm font-mono text-gray-700 bg-gray-100 px-3 py-1 rounded">
                {compassRotation}°
              </div>
              
              {/* Rotation Controls */}
              <div className="flex gap-1">
                <button
                  onClick={() => rotateCompass(-5)}
                  className="px-3 py-1 bg-blue-100 hover:bg-blue-200 text-blue-700 text-sm rounded transition"
                  title="Rotate -5°"
                >
                  ↺ 5°
                </button>
                <button
                  onClick={() => rotateCompass(5)}
                  className="px-3 py-1 bg-blue-100 hover:bg-blue-200 text-blue-700 text-sm rounded transition"
                  title="Rotate +5°"
                >
                  ↻ 5°
                </button>
              </div>
              <button
                onClick={() => setCompassRotation(0)}
                className="text-xs text-gray-500 hover:text-gray-700 underline"
              >
                Reset to North
              </button>
            </div>
          </div>
          
          <div className="space-y-3">
            {layout.map((block, blockIdx) => (
              <div key={blockIdx} className="flex items-start gap-2">
                {/* Block Label */}
                <div className="flex-shrink-0 w-24 text-right pr-2 sticky left-0 bg-white z-10">
                  <div className="text-sm font-semibold text-gray-700">
                    Block {blockIdx + 1}
                  </div>
                  <div className="flex gap-1 justify-end mt-1">
                    <button
                      onClick={() => randomizeBlock(blockIdx)}
                      className="p-1 bg-purple-100 hover:bg-purple-200 rounded transition"
                      title="Randomize this block"
                    >
                      <Shuffle size={12} className="text-purple-600" />
                    </button>
                    <button
                      onClick={() => addBlankToBlock(blockIdx, block.length)}
                      className="p-1 bg-green-100 hover:bg-green-200 rounded transition"
                      title="Add blank to end"
                    >
                      <Plus size={12} className="text-green-600" />
                    </button>
                  </div>
                </div>

                {/* Block Plots */}
                <div className="flex gap-2 flex-1 flex-wrap">
                  {block.map((plot, plotIdx) => (
                    <div
                      key={plot.id}
                      draggable={!plot.isBlank}
                      onDragStart={(e) => handleDragStart(e, blockIdx, plotIdx)}
                      onDragOver={handleDragOver}
                      onDrop={(e) => handleDrop(e, blockIdx, plotIdx)}
                      className={`
                        relative flex-shrink-0 w-20 h-20 rounded-lg shadow-md transition-all
                        ${plot.isBlank 
                          ? 'bg-gray-100 border-2 border-dashed border-gray-300' 
                          : 'cursor-move hover:shadow-xl hover:scale-105'
                        }
                      `}
                      style={{ 
                        backgroundColor: plot.isBlank ? undefined : treatmentColors[plot.treatment],
                      }}
                    >
                      {plot.isBlank ? (
                        <button
                          onClick={() => removeBlank(blockIdx, plotIdx)}
                          className="absolute inset-0 flex items-center justify-center hover:bg-red-100 rounded-lg transition group"
                        >
                          <Minus 
                            size={20} 
                            className="text-gray-400 group-hover:text-red-500 transition"
                          />
                        </button>
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="text-3xl font-bold text-white">
                            {plot.treatment}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                  
                  {/* Quick add blank at end */}
                  <button
                    onClick={() => addBlankToBlock(blockIdx, block.length)}
                    className="flex-shrink-0 w-20 h-20 border-2 border-dashed border-gray-300 rounded-lg hover:border-green-500 hover:bg-green-50 transition flex items-center justify-center group"
                  >
                    <Plus size={24} className="text-gray-400 group-hover:text-green-600" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-semibold text-blue-900 mb-2">How to Use:</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• <strong>Each row = 1 complete block</strong> containing all treatments (plots resize to fit)</li>
            <li>• <strong>Compass:</strong> Adjust field orientation in 5° increments</li>
            <li>• <strong>Drag & Drop:</strong> Swap plots within the same row only</li>
            <li>• <strong>Randomize:</strong> Use shuffle button on each block or randomize all</li>
            <li>• <strong>Add Blanks:</strong> Click + button or the dashed square at end of row</li>
            <li>• <strong>Remove Blanks:</strong> Click − on any blank space</li>
            <li>• <strong>Save:</strong> Export layout with orientation when ready to use in your trial</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default TrialLayoutEditor;
