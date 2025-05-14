import styled from 'styled-components';

export const Tag = styled.span`
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 0.8rem;
  font-weight: bold;
  margin-left: 8px;
`;

export const OverdueTag = styled(Tag)`
  background-color: #ff6b6b;
  color: white;
`; 