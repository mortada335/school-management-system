import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { RotateCcw, FilterIcon, SearchIcon } from "lucide-react";
import { useTranslation } from "@/lib/i18n";
import Text from "@/components/layout/text";
import useDebounce from "@/hooks/useDebounce";

export interface FilterItem {
  key: string;
  value: any;
}

export interface FiltersSectionProps {
  value?: FilterItem[];
  onChange?: (val: FilterItem[]) => void;
  isMenuOpen?: boolean;
  setIsMenuOpen?: (val: boolean | ((prev: boolean) => boolean)) => void;
  setPage?: (page: number) => void;
  isLoading?: boolean;
  searchQueryKey?: string;
  containerClassName?: string;
  className?: string;
  searchQuery?: string;
  setSearchQuery?: (val: string) => void;
  onClearFilters?: () => void;
  hasActiveFilters?: boolean;
  placeholderKey?: string;
  [key: string]: any;
}

const FiltersSection = ({
  value = [],
  onChange = () => {},
  isMenuOpen = false,
  setIsMenuOpen = () => {},
  setPage = () => {},
  isLoading = false,
  searchQueryKey = "filter[name]",
  containerClassName = "",
  className = "",
  searchQuery,
  setSearchQuery,
  onClearFilters,
  hasActiveFilters,
  placeholderKey,
  ...props
}: FiltersSectionProps) => {
  const { t } = useTranslation();
  const [input, setInput] = useState<string | null>(searchQuery ?? null);
  const isFilter = (value && value.length > 0) || Boolean(hasActiveFilters);
  const debouncedInputValue = useDebounce(input, 1500);

  useEffect(() => {
    if (searchQuery !== undefined) {
      setInput(searchQuery);
    }
  }, [searchQuery]);

  const clearFilters = () => {
    onChange([]);
    setInput("");
    if (setSearchQuery) setSearchQuery("");
    if (onClearFilters) onClearFilters();
  };

  const onFiltersChange = (inputValue: string | null) => {
    if (setSearchQuery) {
      setSearchQuery(inputValue || "");
    }
    const currentItems = [...(value || [])];
    const index = currentItems.findIndex((item) => item?.key === searchQueryKey);
    if (index === -1) {
      if (inputValue) {
        currentItems.push({ key: searchQueryKey, value: inputValue });
      }
    } else {
      if (inputValue) {
        currentItems[index] = { ...currentItems[index], value: inputValue };
      } else {
        currentItems.splice(index, 1);
      }
    }
    onChange(currentItems);
    if (typeof setPage === "function") {
      setPage(1);
    }
  };

  useEffect(() => {
    if (debouncedInputValue !== null && debouncedInputValue !== undefined) {
      onFiltersChange(debouncedInputValue);
    }
  }, [debouncedInputValue, searchQueryKey]);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onFiltersChange(input);
      }}
      className={cn("w-full lg:w-[500px]", containerClassName)}
    >
      <Card
        {...props}
        className={cn(
          "flex flex-row items-center justify-between overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/10 dark:bg-gray-900 shadow-2xs p-0 py-0 gap-0 h-10 w-full",
          className
        )}
      >
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={input ? "secondary" : "ghost"}
                size="icon"
                type="submit"
                disabled={isLoading}
                className="h-10 w-10 shrink-0 rounded-none border-0 border-e border-gray-200 dark:border-white/10 hover:bg-gray-100 dark:hover:bg-white/10 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
              >
                <SearchIcon className="h-4 w-4 opacity-70" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <Text text="Search" />
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <Input
          onChange={(e) => setInput(e.target.value)}
          type="text"
          placeholder={
            placeholderKey
              ? `${t(placeholderKey)}...`
              : `${t("search_by")} ${t(searchQueryKey || "")} ...`
          }
          disabled={isLoading}
          className="h-10 flex-1 min-w-0 rounded-none border-0 bg-transparent px-3 py-2 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 outline-none ring-0 focus-visible:ring-0 focus-visible:border-0 shadow-none dark:bg-transparent"
          value={input ?? ""}
        />

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={isMenuOpen ? "secondary" : "ghost"}
                size="icon"
                type="button"
                className={cn(
                  "h-10 w-10 shrink-0 rounded-none border-0 border-s border-gray-200 dark:border-white/10 hover:bg-gray-100 dark:hover:bg-white/10 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white",
                  isMenuOpen && "bg-gray-100 dark:bg-white/10 text-gray-900 dark:text-white"
                )}
                onClick={() => setIsMenuOpen(!isMenuOpen)}
              >
                <FilterIcon className="h-4 w-4 opacity-70" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <Text text="Toggle filters menu" />
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        {isFilter && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  onClick={clearFilters}
                  size="icon"
                  variant="ghost"
                  type="button"
                  className="h-10 w-10 shrink-0 rounded-none border-0 border-s border-gray-200 dark:border-white/10 text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10"
                >
                  <RotateCcw className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-xs">{t("Clear Filters")}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </Card>
    </form>
  );
};

export default FiltersSection;
