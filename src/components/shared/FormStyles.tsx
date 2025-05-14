import styled from 'styled-components';

// Form container
export const FormContainer = styled.div`
  border: 1px solid #dfdfdf;
  box-shadow: inset 1px 1px 0px 1px #ffffff, inset -1px -1px 0px 1px #888888, 0 3px 8px rgba(0, 0, 0, 0.1);
  padding: 20px;
  margin-bottom: 20px;
  border-radius: 4px;
  background-color: #fff;
`;

// Row for form fields (vertical layout)
export const FormRow = styled.div`
  margin-bottom: 16px;
  display: flex;
  flex-direction: column;
`;

// Row for form fields that should be displayed horizontally
export const FormRowHorizontal = styled.div`
  margin-bottom: 16px;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
`;

// Label for form fields
export const Label = styled.label`
  margin-bottom: 6px;
  font-weight: 500;
  font-size: 1.05rem;
`;

// Input field styling
export const Input = styled.input`
  height: 38px;
  padding: 8px 12px;
  font-size: 1.05rem;
  border: 1px solid #ccc;
  border-radius: 2px;
  
  &:focus {
    border-color: #0066cc;
    outline: none;
    box-shadow: 0 0 0 2px rgba(0, 102, 204, 0.2);
  }
`;

// Select field styling
export const Select = styled.select`
  height: 38px;
  padding: 8px 12px;
  font-size: 1.05rem;
  border: 1px solid #ccc;
  border-radius: 2px;
  background-color: white;
  
  &:focus {
    border-color: #0066cc;
    outline: none;
    box-shadow: 0 0 0 2px rgba(0, 102, 204, 0.2);
  }
`;

// Textarea styling
export const TextArea = styled.textarea`
  min-height: 80px;
  padding: 8px 12px;
  font-size: 1.05rem;
  border: 1px solid #ccc;
  border-radius: 2px;
  resize: vertical;
  
  &:focus {
    border-color: #0066cc;
    outline: none;
    box-shadow: 0 0 0 2px rgba(0, 102, 204, 0.2);
  }
`;

// Button container
export const ButtonRow = styled.div`
  display: flex;
  gap: 12px;
  margin-top: 8px;
`;

// Primary button
export const PrimaryButton = styled.button`
  background: linear-gradient(to bottom, #4f94ea, #3a7bd5);
  color: white;
  font-size: 1.05rem;
  padding: 8px 16px;
  border-radius: 4px;
  border: 1px solid #2c5ea9;
  cursor: pointer;
  
  &:hover {
    background: linear-gradient(to bottom, #5ca0ff, #4485e6);
  }
  
  &:active {
    background: #3a7bd5;
  }
`;

// Secondary button
export const SecondaryButton = styled.button`
  background: linear-gradient(to bottom, #f5f5f5, #e6e6e6);
  color: #333;
  font-size: 1.05rem;
  padding: 8px 16px;
  border-radius: 4px;
  border: 1px solid #ccc;
  cursor: pointer;
  
  &:hover {
    background: linear-gradient(to bottom, #ffffff, #f0f0f0);
  }
  
  &:active {
    background: #e6e6e6;
  }
`; 