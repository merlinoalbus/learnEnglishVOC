import { useState, useCallback, useMemo } from 'react';
import type { Word } from '../../types/entities/Word.types';

type FilterOperator = 'equals' | 'contains' | 'startsWith' | 'endsWith' | 'regex' | 'gt' | 'lt' | 'gte' | 'lte' | 'in' | 'notIn';

interface FilterCondition<T = any> {
  field: string;
  operator: FilterOperator;
  value: T;
  caseSensitive?: boolean;
}

interface FilterGroup {
  conditions: FilterCondition[];
  operator: 'and' | 'or';
}

interface SortConfig {
  field: string;
  direction: 'asc' | 'desc';
}

interface FilterOptions {
  search?: string;
  searchFields?: string[];
  caseSensitive?: boolean;
  filters?: FilterGroup[];
  sort?: SortConfig[];
  pagination?: {
    page: number;
    limit: number;
  };
}

interface FilterResult<T> {
  items: T[];
  total: number;
  filtered: number;
  page?: number;
  totalPages?: number;
  hasMore?: boolean;
}

interface FilterStats {
  total: number;
  filtered: number;
  groups: Record<string, number>;
  learned: number;
  difficult: number;
}

interface FilterHookState {
  searchQuery: string;
  activeFilters: FilterGroup[];
  sortConfig: SortConfig[];
  currentPage: number;
  itemsPerPage: number;
  isFiltering: boolean;
}

interface FilterHookReturn<T = any> {
  searchQuery: string;
  activeFilters: FilterGroup[];
  sortConfig: SortConfig[];
  currentPage: number;
  itemsPerPage: number;
  isFiltering: boolean;
  filteredItems: T[];
  totalItems: number;
  filteredCount: number;
  totalPages: number;
  hasMore: boolean;
  stats: FilterStats | null;
  setSearchQuery: (query: string) => void;
  addFilter: (condition: FilterCondition) => void;
  removeFilter: (index: number) => void;
  clearFilters: () => void;
  addFilterGroup: (group: FilterGroup) => void;
  removeFilterGroup: (index: number) => void;
  setSort: (field: string, direction: 'asc' | 'desc') => void;
  addSort: (field: string, direction: 'asc' | 'desc') => void;
  removeSort: (field: string) => void;
  clearSort: () => void;
  setPage: (page: number) => void;
  setItemsPerPage: (limit: number) => void;
  nextPage: () => void;
  prevPage: () => void;
  goToFirstPage: () => void;
  goToLastPage: () => void;
  applyFilters: (items: T[], options?: FilterOptions) => FilterResult<T>;
  resetFilters: () => void;
  getFilterStats: (items: T[]) => FilterStats;
}

export const useFilters = <T extends Record<string, any> = Word>(
  initialItems: T[] = []
): FilterHookReturn<T> => {
  const [state, setState] = useState<FilterHookState>({
    searchQuery: '',
    activeFilters: [],
    sortConfig: [],
    currentPage: 1,
    itemsPerPage: 20,
    isFiltering: false,
  });

  const [items, setItems] = useState<T[]>(initialItems);

  const setSearchQuery = useCallback((query: string) => {
    setState(prev => ({
      ...prev,
      searchQuery: query,
      currentPage: 1,
    }));
  }, []);

  const addFilter = useCallback((condition: FilterCondition) => {
    setState(prev => ({
      ...prev,
      activeFilters: [
        ...prev.activeFilters,
        {
          conditions: [condition],
          operator: 'and' as const,
        },
      ],
      currentPage: 1,
    }));
  }, []);

  const removeFilter = useCallback((index: number) => {
    setState(prev => ({
      ...prev,
      activeFilters: prev.activeFilters.filter((_, i) => i !== index),
      currentPage: 1,
    }));
  }, []);

  const clearFilters = useCallback(() => {
    setState(prev => ({
      ...prev,
      activeFilters: [],
      currentPage: 1,
    }));
  }, []);

  const addFilterGroup = useCallback((group: FilterGroup) => {
    setState(prev => ({
      ...prev,
      activeFilters: [...prev.activeFilters, group],
      currentPage: 1,
    }));
  }, []);

  const removeFilterGroup = useCallback((index: number) => {
    setState(prev => ({
      ...prev,
      activeFilters: prev.activeFilters.filter((_, i) => i !== index),
      currentPage: 1,
    }));
  }, []);

  const setSort = useCallback((field: string, direction: 'asc' | 'desc') => {
    setState(prev => ({
      ...prev,
      sortConfig: [{ field, direction }],
      currentPage: 1,
    }));
  }, []);

  const addSort = useCallback((field: string, direction: 'asc' | 'desc') => {
    setState(prev => ({
      ...prev,
      sortConfig: [
        ...prev.sortConfig.filter(sort => sort.field !== field),
        { field, direction },
      ],
      currentPage: 1,
    }));
  }, []);

  const removeSort = useCallback((field: string) => {
    setState(prev => ({
      ...prev,
      sortConfig: prev.sortConfig.filter(sort => sort.field !== field),
      currentPage: 1,
    }));
  }, []);

  const clearSort = useCallback(() => {
    setState(prev => ({
      ...prev,
      sortConfig: [],
      currentPage: 1,
    }));
  }, []);

  const setPage = useCallback((page: number) => {
    setState(prev => ({
      ...prev,
      currentPage: Math.max(1, page),
    }));
  }, []);

  const setItemsPerPage = useCallback((limit: number) => {
    setState(prev => ({
      ...prev,
      itemsPerPage: Math.max(1, limit),
      currentPage: 1,
    }));
  }, []);

  const nextPage = useCallback(() => {
    setState(prev => ({
      ...prev,
      currentPage: prev.currentPage + 1,
    }));
  }, []);

  const prevPage = useCallback(() => {
    setState(prev => ({
      ...prev,
      currentPage: Math.max(1, prev.currentPage - 1),
    }));
  }, []);

  const goToFirstPage = useCallback(() => {
    setState(prev => ({
      ...prev,
      currentPage: 1,
    }));
  }, []);

  const goToLastPage = useCallback(() => {
    setState(prev => {
      const totalPages = Math.ceil(items.length / prev.itemsPerPage);
      return {
        ...prev,
        currentPage: totalPages,
      };
    });
  }, [items.length]);

  const resetFilters = useCallback(() => {
    setState(prev => ({
      ...prev,
      searchQuery: '',
      activeFilters: [],
      sortConfig: [],
      currentPage: 1,
    }));
  }, []);

  const evaluateCondition = useCallback((item: T, condition: FilterCondition): boolean => {
    const fieldValue = item[condition.field];
    const { value, operator, caseSensitive = false } = condition;

    if (fieldValue === undefined || fieldValue === null) {
      return false;
    }

    const itemValue = caseSensitive ? fieldValue : String(fieldValue).toLowerCase();
    const filterValue = caseSensitive ? value : String(value).toLowerCase();

    switch (operator) {
      case 'equals':
        return itemValue === filterValue;
      case 'contains':
        return String(itemValue).includes(String(filterValue));
      case 'startsWith':
        return String(itemValue).startsWith(String(filterValue));
      case 'endsWith':
        return String(itemValue).endsWith(String(filterValue));
      case 'regex':
        try {
          const regex = new RegExp(String(filterValue), caseSensitive ? 'g' : 'gi');
          return regex.test(String(itemValue));
        } catch {
          return false;
        }
      case 'gt':
        return Number(itemValue) > Number(filterValue);
      case 'lt':
        return Number(itemValue) < Number(filterValue);
      case 'gte':
        return Number(itemValue) >= Number(filterValue);
      case 'lte':
        return Number(itemValue) <= Number(filterValue);
      case 'in':
        return Array.isArray(filterValue) && filterValue.includes(itemValue);
      case 'notIn':
        return Array.isArray(filterValue) && !filterValue.includes(itemValue);
      default:
        return false;
    }
  }, []);

  const evaluateFilterGroup = useCallback((item: T, group: FilterGroup): boolean => {
    const { conditions, operator } = group;
    
    if (conditions.length === 0) return true;

    const results = conditions.map(condition => evaluateCondition(item, condition));
    
    return operator === 'and' ? results.every(Boolean) : results.some(Boolean);
  }, [evaluateCondition]);

  const performSearch = useCallback((item: T, searchQuery: string, searchFields: string[] = []): boolean => {
    if (!searchQuery.trim()) return true;

    const query = searchQuery.toLowerCase();
    const fieldsToSearch = searchFields.length > 0 ? searchFields : Object.keys(item);

    return fieldsToSearch.some(field => {
      const fieldValue = item[field];
      if (fieldValue === undefined || fieldValue === null) return false;
      return String(fieldValue).toLowerCase().includes(query);
    });
  }, []);

  const sortItems = useCallback((items: T[], sortConfig: SortConfig[]): T[] => {
    if (sortConfig.length === 0) return items;

    return [...items].sort((a, b) => {
      for (const { field, direction } of sortConfig) {
        const aValue = a[field];
        const bValue = b[field];

        if (aValue === bValue) continue;

        let comparison = 0;
        
        if (aValue == null) comparison = -1;
        else if (bValue == null) comparison = 1;
        else if (typeof aValue === 'string' && typeof bValue === 'string') {
          comparison = aValue.localeCompare(bValue);
        } else {
          comparison = aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
        }

        return direction === 'desc' ? -comparison : comparison;
      }
      return 0;
    });
  }, []);

  const applyFilters = useCallback((
    targetItems: T[],
    options: FilterOptions = {}
  ): FilterResult<T> => {
    setState(prev => ({ ...prev, isFiltering: true }));

    try {
      const {
        search = state.searchQuery,
        searchFields = [],
        caseSensitive = false,
        filters = state.activeFilters,
        sort = state.sortConfig,
        pagination = {
          page: state.currentPage,
          limit: state.itemsPerPage,
        },
      } = options;

      let filtered = targetItems;

      // Apply search
      if (search) {
        filtered = filtered.filter(item => performSearch(item, search, searchFields));
      }

      // Apply filters
      if (filters.length > 0) {
        filtered = filtered.filter(item => {
          return filters.every(group => evaluateFilterGroup(item, group));
        });
      }

      // Apply sorting
      if (sort.length > 0) {
        filtered = sortItems(filtered, sort);
      }

      // Apply pagination
      const total = filtered.length;
      const totalPages = Math.ceil(total / pagination.limit);
      const startIndex = (pagination.page - 1) * pagination.limit;
      const endIndex = startIndex + pagination.limit;
      const paginatedItems = filtered.slice(startIndex, endIndex);

      return {
        items: paginatedItems,
        total: targetItems.length,
        filtered: total,
        page: pagination.page,
        totalPages,
        hasMore: endIndex < total,
      };
    } finally {
      setState(prev => ({ ...prev, isFiltering: false }));
    }
  }, [state, performSearch, evaluateFilterGroup, sortItems]);

  const getFilterStats = useCallback((targetItems: T[]): FilterStats => {
    const stats: FilterStats = {
      total: targetItems.length,
      filtered: 0,
      groups: {},
      learned: 0,
      difficult: 0,
    };

    const result = applyFilters(targetItems);
    stats.filtered = result.filtered;

    // Calculate group statistics (assuming Word-like structure)
    result.items.forEach(item => {
      if ('group' in item && item.group) {
        stats.groups[item.group] = (stats.groups[item.group] || 0) + 1;
      }
      if ('learned' in item && item.learned) {
        stats.learned++;
      }
      if ('difficult' in item && item.difficult) {
        stats.difficult++;
      }
    });

    return stats;
  }, [applyFilters]);

  // Memoized computed values
  const filteredResult = useMemo(() => {
    return applyFilters(items);
  }, [items, applyFilters]);

  const stats = useMemo(() => {
    return getFilterStats(items);
  }, [items, getFilterStats]);

  const totalPages = Math.ceil(filteredResult.filtered / state.itemsPerPage);

  return {
    searchQuery: state.searchQuery,
    activeFilters: state.activeFilters,
    sortConfig: state.sortConfig,
    currentPage: state.currentPage,
    itemsPerPage: state.itemsPerPage,
    isFiltering: state.isFiltering,
    filteredItems: filteredResult.items,
    totalItems: filteredResult.total,
    filteredCount: filteredResult.filtered,
    totalPages,
    hasMore: filteredResult.hasMore || false,
    stats,
    setSearchQuery,
    addFilter,
    removeFilter,
    clearFilters,
    addFilterGroup,
    removeFilterGroup,
    setSort,
    addSort,
    removeSort,
    clearSort,
    setPage,
    setItemsPerPage,
    nextPage,
    prevPage,
    goToFirstPage,
    goToLastPage,
    applyFilters,
    resetFilters,
    getFilterStats,
  };
};

export default useFilters;