import React from 'react';
import styled from 'styled-components';
import { BookmarkFilter } from '../types';

const FilterContainer = styled.div`
  margin-bottom: 20px;
  display: flex;
  gap: 10px;
  align-items: center;
`;

const Label = styled.label`
  font-weight: bold;
`;

const Select = styled.select`
  padding: 8px 12px;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 14px;
`;

interface FilterBarProps {
  bookmarkFilter: BookmarkFilter;
  onFilterChange: (filter: BookmarkFilter) => void;
}

const FilterBar: React.FC<FilterBarProps> = ({ bookmarkFilter, onFilterChange }) => {
  return (
    <FilterContainer>
      <Label htmlFor="bookmark-filter">Filter by bookmark status:</Label>
      <Select
        id="bookmark-filter"
        value={bookmarkFilter}
        onChange={(e) => onFilterChange(e.target.value as BookmarkFilter)}
      >
        <option value="all">All Images</option>
        <option value="bookmarked">Bookmarked Only</option>
        <option value="unbookmarked">Unbookmarked Only</option>
      </Select>
    </FilterContainer>
  );
};

export default FilterBar;
