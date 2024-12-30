import { useState } from 'react';
import { useIntl } from 'react-intl';
import { Search } from 'lucide-react';
import { Input } from '@workspace/ui/components/input';
import { Button } from '@workspace/ui/components/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@workspace/ui/components/select';

interface BotSearchProps {
  onSearch: (query: string, type: string) => void;
}

export function BotSearch({ onSearch }: BotSearchProps) {
  const intl = useIntl();
  const [query, setQuery] = useState('');
  const [searchType, setSearchType] = useState('name');

  const handleSearch = () => {
    onSearch(query, searchType);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <div className="flex flex-col sm:flex-row gap-2">
      <div className="flex-1 flex gap-2">
        <Input
          placeholder={intl.formatMessage({ id: 'bot.search.placeholder' })}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          className="text-sm sm:text-base"
        />
        <Select value={searchType} onValueChange={setSearchType}>
          <SelectTrigger className="w-[120px] sm:w-[180px] text-sm sm:text-base">
            <SelectValue placeholder={intl.formatMessage({ id: 'bot.search.type' })} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="name" className="text-sm sm:text-base">
              {intl.formatMessage({ id: 'bot.search.type.name' })}
            </SelectItem>
            <SelectItem value="token" className="text-sm sm:text-base">
              {intl.formatMessage({ id: 'bot.search.type.token' })}
            </SelectItem>
            <SelectItem value="all" className="text-sm sm:text-base">
              {intl.formatMessage({ id: 'bot.search.type.all' })}
            </SelectItem>
          </SelectContent>
        </Select>
      </div>
      <Button 
        onClick={handleSearch}
        className="w-full sm:w-auto text-sm sm:text-base"
      >
        <Search className="mr-2 h-4 w-4" />
        {intl.formatMessage({ id: 'bot.search.button' })}
      </Button>
    </div>
  );
} 