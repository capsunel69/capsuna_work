import styled from 'styled-components';

export const FormContainer = styled.div`
  padding: 0;
  margin-bottom: 0;
  background-color: transparent;
`;

export const InlineFormContainer = styled.div`
  padding: 15px;
  background-color: #f8f9fa;
  border-bottom: 1px solid #e5e5e5;
  
  &:last-child {
    border-bottom: none;
  }
`;

export const FormRow = styled.div`
  margin-bottom: 12px;
  display: flex;
  flex-direction: column;
`;

export const FormRowHorizontal = styled.div`
  margin-bottom: 12px;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 15px;
`;

export const Label = styled.label`
  margin-bottom: 5px;
  font-weight: 600;
  font-size: 13px;
  color: #333;
`;

export const Input = styled.input`
  height: 34px;
  padding: 6px 10px;
  font-size: 14px;
  border: 1px solid #ced4da;
  border-radius: 3px;
  background: #fff;
  transition: border-color 0.15s;
  
  &:focus {
    border-color: #007bff;
    outline: none;
    box-shadow: 0 0 0 2px rgba(0,123,255,0.15);
  }
  
  &::placeholder {
    color: #adb5bd;
  }
`;

export const DateInput = styled(Input)`
  &::-webkit-calendar-picker-indicator {
    cursor: pointer;
  }
`;

export const Select = styled.select`
  height: 34px;
  padding: 6px 10px;
  font-size: 14px;
  border: 1px solid #ced4da;
  border-radius: 3px;
  background-color: white;
  cursor: pointer;
  
  &:focus {
    border-color: #007bff;
    outline: none;
    box-shadow: 0 0 0 2px rgba(0,123,255,0.15);
  }
`;

export const TextArea = styled.textarea`
  min-height: 70px;
  padding: 8px 10px;
  font-size: 14px;
  border: 1px solid #ced4da;
  border-radius: 3px;
  resize: vertical;
  font-family: inherit;
  line-height: 1.5;
  
  &:focus {
    border-color: #007bff;
    outline: none;
    box-shadow: 0 0 0 2px rgba(0,123,255,0.15);
  }
  
  &::placeholder {
    color: #adb5bd;
  }
`;

export const ButtonRow = styled.div`
  display: flex;
  gap: 10px;
  margin-top: 15px;
`;

export const PrimaryButton = styled.button`
  background: linear-gradient(180deg, #007bff, #0062cc);
  color: white;
  font-size: 13px;
  font-weight: 600;
  padding: 8px 20px;
  border-radius: 3px;
  border: 1px solid #0056b3;
  cursor: pointer;
  transition: all 0.15s;
  
  &:hover {
    background: linear-gradient(180deg, #0069d9, #0056b3);
  }
  
  &:active {
    background: #0056b3;
  }
  
  &:disabled {
    background: #6c757d;
    border-color: #6c757d;
    cursor: not-allowed;
  }
`;

export const SecondaryButton = styled.button`
  background: linear-gradient(180deg, #6c757d, #545b62);
  color: white;
  font-size: 13px;
  font-weight: 600;
  padding: 8px 20px;
  border-radius: 3px;
  border: 1px solid #545b62;
  cursor: pointer;
  transition: all 0.15s;
  
  &:hover {
    background: linear-gradient(180deg, #5a6268, #494f54);
  }
  
  &:active {
    background: #545b62;
  }
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;
