'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Search } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';

export function SearchDialog() {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // This would normally perform a search
    // For now it's a placeholder
    console.log('Searching for:', search);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon">
          <Search className="h-5 w-5" />
          <span className="sr-only">Search</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Search</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSearch} className="flex space-x-2">
          <Input
            placeholder="Search repositories, contributors, etc."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1"
          />
          <Button type="submit">Search</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
} 