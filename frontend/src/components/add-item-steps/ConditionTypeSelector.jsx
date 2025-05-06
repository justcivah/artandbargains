import React, { useState } from 'react';
import { createEntity } from '../../api/itemsApi';
import '../../styles/StepComponents.css';

const ConditionTypeSelector = ({ 
  conditionTypes, 
  selectedConditionType, 
  conditionDescription, 
  onChange,
  onDescriptionChange,
  setConditionTypes 
}) => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newConditionName, setNewConditionName] = useState('');
  const [newConditionDisplayName, setNewConditionDisplayName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  
  const handleConditionSelect = (condition) => {
    onChange(condition);
  };
  
  const handleCreateCondition = async (e) => {
    e.preventDefault();
    
    if (!newConditionName || !newConditionDisplayName) {
      setError('Both name and display name are required');
      return;
    }
    
    try {
      setIsSubmitting(true);
      setError(null);
      
      // Format the condition name
      const formattedName = newConditionName.toLowerCase().replace(/\s+/g, '_');
      
      // Create the new condition
      const newConditionData = {
        PK: `CONDITIONTYPE#${formattedName}`,
        name: formattedName,
        display_name: newConditionDisplayName,
        entity_type: 'condition_type'
      };
      
      await createEntity('conditionTypes', newConditionData);
      
      // Update the list of conditions
      setConditionTypes([...conditionTypes, newConditionData]);
      
      // Select the new condition
      onChange(formattedName);
      
      // Close the modal
      setShowCreateModal(false);
      setNewConditionName('');
      setNewConditionDisplayName('');
    } catch (err) {
      setError('Error creating condition type: ' + err.message);
      console.error('Error creating condition type:', err);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <div className="step-container">
      <h2>Item Condition</h2>
      <p className="step-description">
        Select the condition of this item and provide any additional details about its condition.
      </p>
      
      {error && <div className="step-error">{error}</div>}
      
      <div className="selector-grid">
        {conditionTypes.map((condition) => (
          <div 
            key={condition.PK}
            className={`selector-item ${selectedConditionType === condition.name ? 'selected' : ''}`}
            onClick={() => handleConditionSelect(condition.name)}
          >
            <div className="selector-label">{condition.display_name}</div>
          </div>
        ))}
        
        <div 
          className="selector-item add-new"
          onClick={() => setShowCreateModal(true)}
        >
          <div className="selector-icon">+</div>
          <div className="selector-label">Add New Condition</div>
        </div>
      </div>
      
      <div className="form-group">
        <label htmlFor="conditionDescription">Condition Details:</label>
        <textarea
          id="conditionDescription"
          value={conditionDescription}
          onChange={(e) => onDescriptionChange(e.target.value)}
          placeholder="Add any additional details about the condition..."
          rows={3}
        />
        <small>
          Example: "Minor scratches on the base" or "Colors remain vibrant and fresh"
        </small>
      </div>
      
      {showCreateModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Create New Condition Type</h3>
            <form onSubmit={handleCreateCondition}>
              <div className="form-group">
                <label htmlFor="conditionName">Name (for system):</label>
                <input
                  type="text"
                  id="conditionName"
                  value={newConditionName}
                  onChange={(e) => setNewConditionName(e.target.value)}
                  placeholder="e.g. mint_condition"
                  autoFocus
                />
                <small>Use lowercase with underscores instead of spaces</small>
              </div>
              
              <div className="form-group">
                <label htmlFor="conditionDisplayName">Display Name:</label>
                <input
                  type="text"
                  id="conditionDisplayName"
                  value={newConditionDisplayName}
                  onChange={(e) => setNewConditionDisplayName(e.target.value)}
                  placeholder="e.g. Mint Condition"
                />
                <small>This is how the condition will be displayed to users</small>
              </div>
              
              <div className="modal-actions">
                <button 
                  type="button" 
                  className="cancel-button" 
                  onClick={() => {
                    setShowCreateModal(false);
                    setNewConditionName('');
                    setNewConditionDisplayName('');
                    setError(null);
                  }}
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="confirm-button"
                  disabled={!newConditionName || !newConditionDisplayName || isSubmitting}
                >
                  {isSubmitting ? 'Creating...' : 'Create Condition Type'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ConditionTypeSelector;