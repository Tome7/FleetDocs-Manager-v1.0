import { useTranslation } from "react-i18next";
import { Input } from "@/components/ui/input";
import { Search, Filter } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  statusFilter?: string;
  onStatusChange?: (value: string) => void;
  showStatusFilter?: boolean;
}

export const SearchBar = ({ 
  value, 
  onChange, 
  placeholder,
  statusFilter = "all",
  onStatusChange,
  showStatusFilter = true
}: SearchBarProps) => {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col sm:flex-row gap-3 mb-6">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder={placeholder || t('vehicles.searchPlaceholder')}
          className="pl-10"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      </div>

      {showStatusFilter && (
        <Select 
          value={statusFilter} 
          onValueChange={onStatusChange || (() => {})}
        >
          <SelectTrigger className="w-full sm:w-[180px]">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder={t('common.status')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('common.all')}</SelectItem>
            <SelectItem value="active">{t('vehicles.statusActive')}</SelectItem>
            <SelectItem value="inactive">{t('vehicles.statusInactive')}</SelectItem>
            <SelectItem value="maintenance">{t('vehicles.statusMaintenance')}</SelectItem>
            <SelectItem value="on_leave">{t('vehicles.statusOnLeave')}</SelectItem>
          </SelectContent>
        </Select>
      )}
    </div>
  );
};