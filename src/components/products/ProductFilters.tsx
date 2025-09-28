import React, { useState, useCallback, useEffect } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Separator } from '../ui/separator';
import { Badge } from '../ui/badge';
import { Checkbox } from '../ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '../ui/popover';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '../ui/collapsible';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../ui/card';
import {
  Filter,
  X,
  ChevronDown,
  ChevronUp,
  Search,
  DollarSign,
  Package,
  Calendar,
  Tag,
  RotateCcw,
  SlidersHorizontal,
} from 'lucide-react';
import { type ProductListFilters } from '../../shared/types/product-management';
import { ValidationHelpers } from '../../shared/utils/validation';

export interface ProductFiltersProps {
  filters: ProductListFilters;
  onFiltersChange: (filters: ProductListFilters) => void;
  onClearFilters: () => void;
  className?: string;
  showAdvanced?: boolean;
  compact?: boolean;
  disabled?: boolean;
}

const PRODUCT_CATEGORIES = [
  { value: 'electronics', label: 'Electronics' },
  { value: 'clothing', label: 'Clothing' },
  { value: 'books', label: 'Books' },
  { value: 'home-garden', label: 'Home & Garden' },
  { value: 'sports', label: 'Sports & Outdoors' },
  { value: 'toys', label: 'Toys & Games' },
  { value: 'health', label: 'Health & Beauty' },
  { value: 'automotive', label: 'Automotive' },
];

const PRODUCT_STATUSES = [
  { value: 'draft', label: 'Draft' },
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'archived', label: 'Archived' },
];

const SORT_OPTIONS = [
  { value: 'name', label: 'Name' },
  { value: 'created_at', label: 'Date Created' },
  { value: 'updated_at', label: 'Last Updated' },
  { value: 'base_price', label: 'Price' },
];

export const ProductFilters: React.FC<ProductFiltersProps> = ({
  filters,
  onFiltersChange,
  onClearFilters,
  className = '',
  showAdvanced = true,
  compact = false,
  disabled = false,
}) => {
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
  const [localFilters, setLocalFilters] = useState<ProductListFilters>(filters);
  const [searchDebounceTimer, setSearchDebounceTimer] = useState<NodeJS.Timeout | null>(null);

  // Sync local filters with props
  useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);

  // Debounced search handler
  const handleSearchChange = useCallback((value: string) => {
    const sanitized = ValidationHelpers.sanitizeInput(value, 'text');
    setLocalFilters(prev => ({ ...prev, search: sanitized }));

    if (searchDebounceTimer) {
      clearTimeout(searchDebounceTimer);
    }

    const timer = setTimeout(() => {
      onFiltersChange({ ...localFilters, search: sanitized, page: 1 });
    }, 300);

    setSearchDebounceTimer(timer);
  }, [localFilters, onFiltersChange, searchDebounceTimer]);

  // Handle filter changes
  const handleFilterChange = useCallback((key: keyof ProductListFilters, value: ProductListFilters[keyof ProductListFilters]) => {
    const updatedFilters = { ...localFilters, [key]: value, page: 1 };
    setLocalFilters(updatedFilters);
    onFiltersChange(updatedFilters);
  }, [localFilters, onFiltersChange]);

  // Handle price range changes
  const handlePriceChange = useCallback((type: 'min' | 'max', value: string) => {
    const numValue = value === '' ? undefined : parseFloat(value);
    if (numValue !== undefined && (isNaN(numValue) || numValue < 0)) return;

    const priceKey = type === 'min' ? 'min_price' : 'max_price';
    handleFilterChange(priceKey, numValue);
  }, [handleFilterChange]);

  // Clear all filters
  const handleClearAll = useCallback(() => {
    setLocalFilters({});
    onClearFilters();
  }, [onClearFilters]);

  // Count active filters
  const activeFilterCount = Object.keys(filters).filter(key => {
    const value = filters[key as keyof ProductListFilters];
    return value !== undefined && value !== '' && value !== null;
  }).length;

  if (compact) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search products..."
            value={localFilters.search || ''}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-10"
            disabled={disabled}
          />
        </div>

        {/* Quick Filters */}
        <Select
          value={localFilters.status || ''}
          onValueChange={(value) => handleFilterChange('status', value || undefined)}
          disabled={disabled}
        >
          <SelectTrigger className="w-32">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Status</SelectItem>
            {PRODUCT_STATUSES.map((status) => (
              <SelectItem key={status.value} value={status.value}>
                {status.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Advanced Filters Popover */}
        {showAdvanced && (
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" disabled={disabled}>
                <SlidersHorizontal className="h-4 w-4 mr-2" />
                Filters
                {activeFilterCount > 0 && (
                  <Badge variant="secondary" className="ml-2 h-5 w-5 p-0 text-xs">
                    {activeFilterCount}
                  </Badge>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80" align="end">
              <AdvancedFiltersContent
                filters={localFilters}
                onFilterChange={handleFilterChange}
                onPriceChange={handlePriceChange}
                onClearAll={handleClearAll}
                disabled={disabled}
              />
            </PopoverContent>
          </Popover>
        )}
      </div>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">Filters</CardTitle>
            <CardDescription>
              Refine your product search
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {activeFilterCount > 0 && (
              <Badge variant="secondary">
                {activeFilterCount} active
              </Badge>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearAll}
              disabled={disabled || activeFilterCount === 0}
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Clear
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search */}
        <div className="space-y-2">
          <Label htmlFor="search">Search</Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="search"
              placeholder="Search by name, SKU, or description..."
              value={localFilters.search || ''}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-10"
              disabled={disabled}
            />
          </div>
        </div>

        {/* Category */}
        <div className="space-y-2">
          <Label>Category</Label>
          <Select
            value={localFilters.category_id || ''}
            onValueChange={(value) => handleFilterChange('category_id', value || undefined)}
            disabled={disabled}
          >
            <SelectTrigger>
              <SelectValue placeholder="All categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All categories</SelectItem>
              {PRODUCT_CATEGORIES.map((category) => (
                <SelectItem key={category.value} value={category.value}>
                  {category.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Status */}
        <div className="space-y-2">
          <Label>Status</Label>
          <Select
            value={localFilters.status || ''}
            onValueChange={(value) => handleFilterChange('status', value || undefined)}
            disabled={disabled}
          >
            <SelectTrigger>
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All statuses</SelectItem>
              {PRODUCT_STATUSES.map((status) => (
                <SelectItem key={status.value} value={status.value}>
                  {status.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Advanced Filters */}
        {showAdvanced && (
          <Collapsible open={isAdvancedOpen} onOpenChange={setIsAdvancedOpen}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="w-full justify-between p-0 h-auto">
                <span className="font-medium">Advanced Filters</span>
                {isAdvancedOpen ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-4 pt-4">
              <AdvancedFiltersContent
                filters={localFilters}
                onFilterChange={handleFilterChange}
                onPriceChange={handlePriceChange}
                onClearAll={handleClearAll}
                disabled={disabled}
              />
            </CollapsibleContent>
          </Collapsible>
        )}
      </CardContent>
    </Card>
  );
};

interface AdvancedFiltersContentProps {
  filters: ProductListFilters;
  onFilterChange: (key: keyof ProductListFilters, value: ProductListFilters[keyof ProductListFilters]) => void;
  onPriceChange: (type: 'min' | 'max', value: string) => void;
  onClearAll: () => void;
  disabled?: boolean;
}

const AdvancedFiltersContent: React.FC<AdvancedFiltersContentProps> = ({
  filters,
  onFilterChange,
  onPriceChange,
  onClearAll,
  disabled = false,
}) => {
  return (
    <div className="space-y-4">
      {/* Price Range */}
      <div className="space-y-2">
        <Label className="flex items-center gap-2">
          <DollarSign className="h-4 w-4" />
          Price Range
        </Label>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Input
              type="number"
              placeholder="Min"
              value={filters.min_price || ''}
              onChange={(e) => onPriceChange('min', e.target.value)}
              min="0"
              step="0.01"
              disabled={disabled}
            />
          </div>
          <div>
            <Input
              type="number"
              placeholder="Max"
              value={filters.max_price || ''}
              onChange={(e) => onPriceChange('max', e.target.value)}
              min="0"
              step="0.01"
              disabled={disabled}
            />
          </div>
        </div>
      </div>

      {/* Brand */}
      <div className="space-y-2">
        <Label className="flex items-center gap-2">
          <Tag className="h-4 w-4" />
          Brand
        </Label>
        <Input
          placeholder="Enter brand name"
          value={filters.brand || ''}
          onChange={(e) => onFilterChange('brand', e.target.value || undefined)}
          disabled={disabled}
        />
      </div>

      {/* Sort Options */}
      <div className="space-y-2">
        <Label>Sort By</Label>
        <div className="grid grid-cols-2 gap-2">
          <Select
            value={filters.sort_by || ''}
            onValueChange={(value) => onFilterChange('sort_by', value || undefined)}
            disabled={disabled}
          >
            <SelectTrigger>
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              {SORT_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={filters.sort_desc ? 'desc' : 'asc'}
            onValueChange={(value) => onFilterChange('sort_desc', value === 'desc')}
            disabled={disabled}
          >
            <SelectTrigger>
              <SelectValue placeholder="Order" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="asc">Ascending</SelectItem>
              <SelectItem value="desc">Descending</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Stock Options */}
      <div className="space-y-2">
        <Label className="flex items-center gap-2">
          <Package className="h-4 w-4" />
          Stock Status
        </Label>
        <div className="flex items-center space-x-2">
          <Checkbox
            id="low-stock"
            checked={filters.low_stock || false}
            onCheckedChange={(checked) => onFilterChange('low_stock', checked)}
            disabled={disabled}
          />
          <Label htmlFor="low-stock" className="text-sm font-normal">
            Show only low stock items
          </Label>
        </div>
      </div>

      <Separator />

      {/* Clear All Button */}
      <Button
        variant="outline"
        onClick={onClearAll}
        className="w-full"
        disabled={disabled}
      >
        <RotateCcw className="h-4 w-4 mr-2" />
        Clear All Filters
      </Button>
    </div>
  );
};

export default ProductFilters;