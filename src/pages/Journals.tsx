import React, { useState, useEffect, useRef } from 'react';
import { useAppContext } from '../context/AppContext';
import styled from 'styled-components';
import { format } from 'date-fns';
import DOMPurify from 'dompurify';
import RichTextEditor from '../components/editor/RichTextEditor';
import PinVerification from '../components/auth/PinVerification';

// Styled components for the Journals page
const JournalsContainer = styled.div`
  display: flex;
  height: 100%;
  gap: 20px;
`;

const JournalsSidebar = styled.div`
  width: 300px;
  border: 1px solid #999;
  background: white;
  box-shadow: inset 1px 1px 0px white, inset -1px -1px 0px #adadad;
  overflow-y: auto;
`;

const JournalEntry = styled.div<{ active: boolean }>`
  padding: 12px;
  border-bottom: 1px solid #dfdfdf;
  cursor: pointer;
  background-color: ${props => props.active ? '#d8e9f9' : 'white'};
  
  &:hover {
    background-color: ${props => props.active ? '#d8e9f9' : '#f0f0f0'};
  }
`;

const JournalTitle = styled.div`
  font-weight: bold;
  margin-bottom: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const JournalDate = styled.div`
  font-size: 0.8rem;
  color: #777;
`;

const JournalPreview = styled.div`
  margin-top: 6px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 0.9rem;
  color: #444;
`;

const JournalContent = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  border: 1px solid #999;
  background: white;
  box-shadow: inset 1px 1px 0px white, inset -1px -1px 0px #adadad;
`;

const JournalTools = styled.div`
  display: flex;
  justify-content: space-between;
  padding: 8px;
  background-color: #ececec;
  border-bottom: 1px solid #dfdfdf;
`;

const JournalEditorContainer = styled.div`
  flex: 1;
  padding: 15px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 15px;
`;

const TitleInput = styled.input`
  width: 100%;
  padding: 8px;
  margin-bottom: 15px;
  background-color: white;
  border: 1px solid #999;
  font-size: 1.1rem;
`;

const SearchBox = styled.input`
  width: 100%;
  padding: 8px;
  margin-bottom: 10px;
  background-color: white;
  border: 1px solid #999;
`;

const TagsInput = styled.input`
  width: 100%;
  padding: 8px;
  margin-bottom: 15px;
  background-color: white;
  border: 1px solid #999;
`;

const TagsContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
  margin-bottom: 15px;
`;

const Tag = styled.div`
  background-color: #d8e9f9;
  padding: 3px 8px;
  border-radius: 3px;
  font-size: 0.8rem;
  display: flex;
  align-items: center;
  border: 1px solid #999;
`;

const TagText = styled.span`
  margin-right: 5px;
`;

const RemoveTag = styled.span`
  cursor: pointer;
  font-weight: bold;
`;

const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #888;
  padding: 20px;
  text-align: center;
`;

const PreviewContainer = styled.div`
  padding: 15px;
  overflow-y: auto;
  height: 100%;
  
  a {
    color: #0078d7;
    text-decoration: underline;
  }

  p {
    margin: 1em 0;
  }

  ul, ol {
    padding-left: 2em;
    margin: 1em 0;
  }

  h1, h2, h3, h4, h5, h6 {
    margin: 1em 0 0.5em;
    line-height: 1.2;
  }

  code {
    background-color: #f5f5f5;
    padding: 0.2em 0.4em;
    border-radius: 3px;
    font-family: monospace;
  }

  blockquote {
    border-left: 3px solid #999;
    margin-left: 0;
    padding-left: 1em;
    font-style: italic;
  }
`;

// Helper to get excerpt
const getExcerpt = (content: string, maxLength = 100) => {
  if (!content) return '';
  
  // Remove HTML tags if present
  const text = content.replace(/<[^>]*>/g, '');
  
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

const Journals: React.FC = () => {
  const { 
    journals, 
    addJournal, 
    updateJournal, 
    deleteJournal, 
    searchJournals,
    isJournalPinVerified,
    setJournalPinVerified
  } = useAppContext();
  
  const [selectedJournal, setSelectedJournal] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredJournals, setFilteredJournals] = useState(journals);
  const [isEditing, setIsEditing] = useState(true);
  const CORRECT_PIN = '42321';
  
  const tagInputRef = useRef<HTMLInputElement>(null);

  // Initialize with today's journal if it exists, but don't auto-create one
  useEffect(() => {
    if (journals.length > 0) {
      // Look for today's journal
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const todayJournal = journals.find(journal => {
        const journalDate = new Date(journal.date);
        journalDate.setHours(0, 0, 0, 0);
        return journalDate.getTime() === today.getTime();
      });
      
      if (todayJournal) {
        setSelectedJournal(todayJournal.id);
        setTitle(todayJournal.title);
        setContent(todayJournal.content);
        setTags(todayJournal.tags || []);
      } else {
        // No journal for today, but don't create one automatically
        // Just select the most recent journal instead if any exist
        const sortedJournals = [...journals].sort((a, b) => 
          new Date(b.date).getTime() - new Date(a.date).getTime()
        );
        
        if (sortedJournals.length > 0) {
          const mostRecent = sortedJournals[0];
          setSelectedJournal(mostRecent.id);
          setTitle(mostRecent.title);
          setContent(mostRecent.content);
          setTags(mostRecent.tags || []);
        }
      }
    }
    
    setFilteredJournals(journals);
  }, [journals]);

  // Handle searching journals
  useEffect(() => {
    if (searchQuery) {
      const search = async () => {
        const results = await searchJournals(searchQuery);
        setFilteredJournals(results);
      };
      search();
    } else {
      setFilteredJournals(journals);
    }
  }, [searchQuery, searchJournals, journals]);

  const handleJournalSelect = (journalId: string) => {
    // Don't save if we're just selecting the same journal again
    if (journalId === selectedJournal) return;
    
    // Save current journal if there are changes
    saveCurrentJournal();
    
    const selected = journals.find(j => j.id === journalId);
    if (selected) {
      setSelectedJournal(journalId);
      setTitle(selected.title);
      setContent(selected.content);
      setTags(selected.tags || []);
      setIsEditing(false); // Switch to view mode when selecting a journal
    }
  };

  const handleNewJournal = () => {
    // Save the current journal first
    saveCurrentJournal();
    
    // Create a new journal for today
    const today = new Date();
    const newJournal = {
      title: `Journal for ${format(today, 'MMMM d, yyyy')}`,
      content: '',
      date: today,
      tags: []
    };
    
    addJournal(newJournal);
    
    // The journal will be added to the state through the useEffect
  };

  // Auto-save when component unmounts or when dependencies change
  useEffect(() => {
    const saveTimer = setTimeout(() => {
      saveCurrentJournal();
    }, 1000); // Debounce save operations by 1 second
    
    return () => {
      clearTimeout(saveTimer);
    };
  }, [title, content, tags]);

  const saveCurrentJournal = () => {
    if (selectedJournal && (title || content)) {
      // Create current state of journal
      const currentState = {
        title,
        content,
        tags,
        updatedAt: new Date()
      };
      
      // Get the existing journal
      const existingJournal = journals.find(j => j.id === selectedJournal);
      
      // Only update if there are actual changes
      if (existingJournal && (
        existingJournal.title !== title ||
        existingJournal.content !== content ||
        JSON.stringify(existingJournal.tags || []) !== JSON.stringify(tags)
      )) {
        updateJournal(selectedJournal, currentState);
      }
    }
  };

  const handleDeleteJournal = () => {
    if (selectedJournal) {
      if (window.confirm('Are you sure you want to delete this journal entry?')) {
        deleteJournal(selectedJournal);
        setSelectedJournal(null);
        setTitle('');
        setContent('');
        setTags([]);
      }
    }
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput('');
      
      // Focus back on the input after adding
      if (tagInputRef.current) {
        tagInputRef.current.focus();
      }
      
      // Don't immediately save - the debounced useEffect will handle this
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    const updatedTags = tags.filter(tag => tag !== tagToRemove);
    setTags(updatedTags);
    
    // Don't immediately save - the debounced useEffect will handle this
  };

  const handleTagInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    }
  };

  if (!isJournalPinVerified) {
    return (
      <JournalsContainer>
        <PinVerification
          correctPin={CORRECT_PIN}
          onSuccess={() => setJournalPinVerified(true)}
        />
      </JournalsContainer>
    );
  }

  return (
    <JournalsContainer>
      <JournalsSidebar>
        <div style={{ padding: '10px' }}>
          <SearchBox 
            type="text" 
            placeholder="Search journals..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <button 
            className="window-button" 
            onClick={handleNewJournal}
            style={{ width: '100%', marginBottom: '10px' }}
          >
            New Journal
          </button>
        </div>
        
        {filteredJournals.length === 0 ? (
          <div style={{ padding: '10px', color: '#888', textAlign: 'center' }}>
            No journals found.
          </div>
        ) : (
          filteredJournals
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
            .map(journal => (
              <JournalEntry 
                key={journal.id} 
                active={selectedJournal === journal.id}
                onClick={() => handleJournalSelect(journal.id)}
              >
                <JournalTitle>{journal.title}</JournalTitle>
                <JournalDate>{format(new Date(journal.date), 'MMMM d, yyyy')}</JournalDate>
                <JournalPreview>{getExcerpt(journal.content)}</JournalPreview>
              </JournalEntry>
            ))
        )}
      </JournalsSidebar>
      
      <JournalContent>
        {selectedJournal ? (
          <>
            <JournalTools>
              <div>
                <button 
                  className="window-button" 
                  onClick={() => setIsEditing(!isEditing)}
                >
                  {isEditing ? 'Preview' : 'Edit'}
                </button>
                <button 
                  className="window-button" 
                  onClick={saveCurrentJournal}
                  style={{ marginLeft: '8px' }}
                >
                  Save
                </button>
              </div>
              <div>
                <button 
                  className="window-button" 
                  onClick={handleDeleteJournal}
                  style={{ backgroundColor: '#ffdddd' }}
                >
                  Delete
                </button>
              </div>
            </JournalTools>
            
            {isEditing ? (
              <JournalEditorContainer>
                <TitleInput 
                  placeholder="Journal Title" 
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
                
                <TagsContainer>
                  {tags.map(tag => (
                    <Tag key={tag}>
                      <TagText>{tag}</TagText>
                      <RemoveTag onClick={() => handleRemoveTag(tag)}>×</RemoveTag>
                    </Tag>
                  ))}
                </TagsContainer>
                
                <TagsInput 
                  ref={tagInputRef}
                  type="text" 
                  placeholder="Add tags (press Enter)" 
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={handleTagInputKeyDown}
                />
                
                <RichTextEditor
                  content={content}
                  onChange={setContent}
                  placeholder="Write your journal entry here..."
                />
              </JournalEditorContainer>
            ) : (
              <PreviewContainer 
                dangerouslySetInnerHTML={{ 
                  __html: DOMPurify.sanitize(content, {
                    ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 's', 'a', 'h1', 'h2', 'h3', 'ul', 'ol', 'li', 'code', 'blockquote'],
                    ALLOWED_ATTR: ['href', 'target', 'rel']
                  })
                }}
              />
            )}
          </>
        ) : (
          <EmptyState>
            <h2>Welcome to your Journal</h2>
            <p>You don't have any journal entries yet. Create your first entry using the "New Journal" button.</p>
            <p>Record your thoughts, links, and daily reflections.</p>
            <button 
              className="window-button" 
              onClick={handleNewJournal}
              style={{ marginTop: '15px', padding: '8px 15px' }}
            >
              Create New Journal Entry
            </button>
          </EmptyState>
        )}
      </JournalContent>
    </JournalsContainer>
  );
};

export default Journals; 