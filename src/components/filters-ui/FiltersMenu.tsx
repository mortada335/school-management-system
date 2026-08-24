import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { motion, AnimatePresence } from "framer-motion";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  X,
} from "lucide-react";
import { useTranslation } from "@/lib/i18n";
import Text from "@/components/layout/text";

import DatePicker from "@/components/ui/date-picker";
import YearPicker from "@/components/ui/year-picker";
import MonthPicker from "@/components/ui/month-picker";
import { customFormatDate } from "@/utils/formatters";
import { DebouncedTextInput } from "@/components/ui/debounced-text-input";
import CustomsCombobox from "@/components/ui/customs-combobox";
import CustomsMultiCombobox from "@/components/ui/customs-multi-combobox";
import StaticMultiSelectCombobox from "@/components/ui/static-multi-select-combobox";

export interface FilterConfig {
  key: string;
  title?: string;
  label?: string;
  type?: "date" | "year" | "month" | "text" | "select" | "combobox" | "multicombobox" | "multiSelect";
  options?: { value: string; label: string }[];
  defaultValue?: string;
  className?: string;
  buttonClassName?: string;
  clearClassName?: string;
  clearButtonClassName?: string;
  containerClassName?: string;
  isTimePicker?: boolean;
  disabled?: boolean;
  hideIcon?: boolean;
  startYear?: number;
  endYear?: number;
  endpoint?: string;
  queryKey?: string;
  itemTitle?: string;
  itemValue?: string;
  searchQueryKey?: string;
  required?: boolean;
  children?: React.ReactNode;
  filters?: any[];
  [key: string]: any;
}

export interface FilterItem {
  key: string;
  value: any;
  itemValue?: any;
}

export interface FiltersMenuProps {
  values?: FilterItem[] | Record<string, any>;
  onChange?: (val: any, keyOrValue?: any) => void;
  defaultsFilters?: FilterConfig[];
  filters?: FilterConfig[];
  setPage?: (page: number) => void;
  setIsMenuOpen?: (val: boolean | ((prev: boolean) => boolean)) => void;
  isMenuOpen?: boolean;
  isLoading?: boolean;
}

const FiltersMenu = ({
  values = [],
  onChange = () => {},
  defaultsFilters = [],
  filters,
  setPage = () => {},
  setIsMenuOpen = () => {},
  isMenuOpen = false,
  isLoading: _isLoading = false,
}: FiltersMenuProps) => {
  const { t } = useTranslation();

  const effectiveFilters: FilterConfig[] = defaultsFilters.length > 0
    ? defaultsFilters
    : (filters || []).map((f) => ({
        ...f,
        title: f.title || f.label || f.key,
      }));

  const getValueForFilter = (key: string) => {
    if (Array.isArray(values)) {
      return values.find((v) => v.key === key)?.value ?? null;
    }
    if (typeof values === "object" && values !== null) {
      return values[key] ?? null;
    }
    return null;
  };

  const updateCustomFilterValue = (index: number, value: any, itemValue?: any) => {
    const updated = [...effectiveFilters];
    if (updated[index]) {
      updated[index] = { ...updated[index], value };
    }

    if (Array.isArray(values)) {
      const currentItems = [...(values || [])];
      const key = effectiveFilters[index]?.key;
      const existingIndex = currentItems.findIndex((item) => item.key === key);
      if (existingIndex !== -1) {
        currentItems[existingIndex] = { ...currentItems[existingIndex], value };
      } else {
        if (value !== undefined && value !== null && value !== "") {
          currentItems.push({ key, value, itemValue });
        }
      }
      onChange(currentItems);
    } else {
      const key = effectiveFilters[index]?.key;
      if (typeof onChange === "function") {
        onChange(key, value);
      }
    }

    if (typeof setPage === "function") {
      setPage(1);
    }
  };

  // Helper function to get dynamic filter values for dependencies
  const getDynamicFilters = (filter: FilterConfig) => {
    if (!filter.filters) return [];

    return filter.filters
      .map((f: any) => {
        if (typeof f.getValue === "function") {
          return {
            ...f,
            value: f.getValue(values),
          };
        }
        if (f.dependsOn) {
          const dependentVal = getValueForFilter(f.dependsOn);
          if (Array.isArray(dependentVal)) {
            const filterConfig = effectiveFilters.find((df) => df.key === f.dependsOn);
            if (filterConfig && filterConfig.type === "multicombobox") {
              return {
                ...f,
                value: dependentVal.map((item: any) => item[filterConfig.itemValue || "id"]),
              };
            }
            return {
              ...f,
              value: dependentVal,
            };
          } else if (dependentVal !== null && dependentVal !== undefined) {
            return {
              ...f,
              value: dependentVal,
            };
          }
          return {
            ...f,
            value: null,
          };
        }
        return f;
      })
      .filter((f: any) => f.value !== null && f.value !== undefined);
  };

  function renderFilterInput(filter: FilterConfig, index: number) {
    const currentValue = getValueForFilter(filter.key);
    const dynamicFilters = getDynamicFilters(filter);
    const title = filter.title || filter.label || filter.key;

    switch (filter.type) {
      case "date":
        return (
          <DatePicker
            title={title}
            className={filter.className}
            buttonClassName={filter.buttonClassName}
            clearClassName={filter.clearClassName}
            clearButtonClassName={filter.clearButtonClassName}
            isTimePicker={filter.isTimePicker}
            disabled={filter.disabled}
            hideIcon={filter.hideIcon}
            date={currentValue}
            setDate={(value) =>
              updateCustomFilterValue(index, customFormatDate(value))
            }
          />
        );
      case "year":
        return (
          <YearPicker
            title={title}
            className={filter.className}
            buttonClassName={filter.buttonClassName}
            clearClassName={filter.clearClassName}
            clearButtonClassName={filter.clearButtonClassName}
            disabled={filter.disabled}
            hideIcon={filter.hideIcon}
            startYear={filter.startYear}
            endYear={filter.endYear}
            year={currentValue}
            setYear={(value) => updateCustomFilterValue(index, value)}
          />
        );
      case "month":
        return (
          <MonthPicker
            title={title}
            className={filter.className}
            buttonClassName={filter.buttonClassName}
            clearClassName={filter.clearClassName}
            clearButtonClassName={filter.clearButtonClassName}
            disabled={filter.disabled}
            hideIcon={filter.hideIcon}
            month={currentValue}
            setMonth={(value) => updateCustomFilterValue(index, value)}
          />
        );
      case "text":
        return (
          <DebouncedTextInput
            title={title}
            value={currentValue}
            onChange={(value) => updateCustomFilterValue(index, value)}
            className={filter.className}
          />
        );
      case "select":
        return (
          <div className="space-y-1.5">
            {title && (
              <label className="text-xs font-medium text-gray-700 dark:text-gray-300">
                {t(title) || title}
              </label>
            )}
            <Select
              onValueChange={(val) => {
                updateCustomFilterValue(index, val);
              }}
              value={currentValue || ""}
              defaultValue={filter.defaultValue || ""}
            >
              <SelectTrigger className="w-full h-9">
                <SelectValue placeholder={`${t("Select")} ${t(title || "")}`} />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {filter.options?.map((opt) => (
                    <SelectItem
                      key={`${filter.key}-${opt.value}`}
                      value={opt.value}
                    >
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
        );
      case "combobox":
        return (
          <CustomsCombobox
            item={currentValue}
            setItem={(value) => {
              updateCustomFilterValue(index, value, filter?.itemValue);
            }}
            endpoint={filter?.endpoint}
            queryKey={filter?.queryKey || filter?.itemValue}
            filters={dynamicFilters}
            itemTitle={filter?.itemTitle || "name"}
            itemValue={filter?.itemValue || "id"}
            placeholder={`${t("Select")} ${filter.title || "Item"}`}
            searchQueryKey={filter?.searchQueryKey || "filter[name]"}
            disabled={filter?.disabled}
            className={filter?.className}
            buttonClassName={filter?.buttonClassName || "rtl:flex-row"}
            clearButtonClassName={filter?.clearButtonClassName}
            clearClassName={filter?.clearClassName}
            containerClassName={filter?.containerClassName}
            hideIcon={filter?.hideIcon}
            label={filter?.label || title}
            required={filter?.required}
            options={filter?.options}
          >
            {filter?.children}
          </CustomsCombobox>
        );
      case "multicombobox":
        return (
          <CustomsMultiCombobox
            items={currentValue || []}
            setItems={(value) => {
              updateCustomFilterValue(index, value, filter?.itemValue);
            }}
            endpoint={filter?.endpoint}
            queryKey={filter?.queryKey || filter?.itemValue}
            filters={dynamicFilters}
            itemTitle={filter?.itemTitle || "name"}
            itemValue={filter?.itemValue || "id"}
            placeholder={`${t("Select")} ${t(filter.title || "Items")}`}
            searchQueryKey={filter?.searchQueryKey || "filter[name]"}
            disabled={filter?.disabled}
            className={filter?.className}
            label={filter?.label || title}
            required={filter?.required}
            options={filter?.options}
          >
            {filter?.children}
          </CustomsMultiCombobox>
        );
      case "multiSelect":
        return (
          <StaticMultiSelectCombobox
            selectedValues={currentValue || []}
            setSelectedValues={(vals) => updateCustomFilterValue(index, vals)}
            options={filter.options || []}
            placeholder={`${t("Select")} ${t(filter.title || "Items")}`}
            disabled={filter?.disabled}
            className={filter?.className}
            buttonClassName={filter?.buttonClassName}
            clearButtonClassName={filter?.clearButtonClassName}
            containerClassName={filter?.containerClassName}
            label={filter?.label || title}
            required={filter?.required}
          />
        );
      default:
        return null;
    }
  }

  return (
    <AnimatePresence>
      {isMenuOpen && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          className="w-full"
        >
          <Card className="w-full border-gray-200 dark:border-white/10 shadow-md bg-white dark:bg-gray-900 overflow-hidden">
            <CardHeader className="relative p-0 px-4 py-2 border-b border-gray-100 dark:border-white/5 bg-gray-50/50 dark:bg-white/5">
              <CardTitle className="flex justify-between items-center w-full text-sm font-semibold text-gray-700 dark:text-gray-300">
                {t("Filter By")}
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setIsMenuOpen(false)}
                        className="h-6 w-6 text-gray-500 hover:text-gray-900 dark:hover:text-white"
                      >
                        <X className="h-4 w-4 opacity-50" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <Text text="Close filters menu" />
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 p-4">
              {effectiveFilters.length === 0 ? (
                <Text
                  text={t("No filters available")}
                  className="text-muted-foreground text-xs py-2"
                />
              ) : (
                effectiveFilters.map((filter, index) => (
                  <div key={filter.key || index}>
                    {filter.type && renderFilterInput(filter, index)}
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default FiltersMenu;
