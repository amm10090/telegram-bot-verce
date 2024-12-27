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

  return (
    <div className="flex gap-2">
      <Input
        placeholder={intl.formatMessage({ id: 'bot.search.placeholder' })}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="max-w-sm"
      />
      <Select value={searchType} onValueChange={setSearchType}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder={intl.formatMessage({ id: 'bot.search.type' })} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="name">
            {intl.formatMessage({ id: 'bot.search.type.name' })}
          </SelectItem>
          <SelectItem value="token">
            {intl.formatMessage({ id: 'bot.search.type.token' })}
          </SelectItem>
          <SelectItem value="all">
            {intl.formatMessage({ id: 'bot.search.type.all' })}
          </SelectItem>
        </SelectContent>
      </Select>
      <Button onClick={handleSearch}>
        <Search className="mr-2 h-4 w-4" />
        {intl.formatMessage({ id: 'bot.search.button' })}
      </Button>
    </div>
  );
} 