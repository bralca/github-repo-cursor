'use client'

import { useState } from 'react'
import { useRepositories, type Repository } from '@/hooks/use-repositories'
import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { ArrowLeft, ArrowRight, Star, GitFork, Calendar } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

interface RepositoriesClientProps {
  initialRepositories: Repository[]
}

export function RepositoriesClient({ initialRepositories }: RepositoriesClientProps) {
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  
  const { data, isLoading, isFetching } = useRepositories(
    page,
    9, // pageSize
    { search: search.length > 0 ? search : null }
  )
  
  const repositories = data?.data || initialRepositories
  const totalPages = data?.totalPages || 1
  
  const handlePreviousPage = () => {
    if (page > 1) {
      setPage(page - 1)
    }
  }
  
  const handleNextPage = () => {
    if (page < totalPages) {
      setPage(page + 1)
    }
  }

  return (
    <div>
      <div className="mb-6">
        <Input
          placeholder="Search repositories..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-md"
        />
      </div>
      
      {isLoading && !initialRepositories.length ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <RepositorySkeleton key={i} />
          ))}
        </div>
      ) : repositories.length === 0 ? (
        <div className="text-center py-10">
          <p className="text-muted-foreground">No repositories found</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {repositories.map((repository) => (
              <RepositoryCard key={repository.id} repository={repository} />
            ))}
          </div>
          
          {totalPages > 1 && (
            <div className="flex justify-center mt-8 gap-2">
              <Button 
                variant="outline" 
                onClick={handlePreviousPage} 
                disabled={page === 1 || isFetching}
              >
                <ArrowLeft className="mr-2 h-4 w-4" /> Previous
              </Button>
              <div className="flex items-center mx-4">
                <span>
                  Page {page} of {totalPages}
                </span>
              </div>
              <Button 
                variant="outline" 
                onClick={handleNextPage} 
                disabled={page >= totalPages || isFetching}
              >
                Next <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  )
}

function RepositoryCard({ repository }: { repository: Repository }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="truncate">{repository.name}</CardTitle>
        <CardDescription className="line-clamp-2">{repository.description || 'No description available'}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center space-x-4 text-sm">
          <div className="flex items-center">
            <Star className="mr-1 h-4 w-4 text-yellow-500" />
            <span>{repository.stars.toLocaleString()}</span>
          </div>
          <div className="flex items-center">
            <GitFork className="mr-1 h-4 w-4" />
            <span>{repository.forks.toLocaleString()}</span>
          </div>
          {repository.language && (
            <span className="px-2 py-1 bg-primary/10 rounded-md text-xs">
              {repository.language}
            </span>
          )}
        </div>
      </CardContent>
      <CardFooter className="text-xs text-muted-foreground">
        <div className="flex items-center">
          <Calendar className="mr-1 h-3 w-3" />
          {repository.updated_at ? (
            <span>Updated {formatDistanceToNow(new Date(repository.updated_at))} ago</span>
          ) : (
            <span>Recently updated</span>
          )}
        </div>
      </CardFooter>
    </Card>
  )
}

function RepositorySkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-5 w-[80%] mb-2" />
        <Skeleton className="h-4 w-[90%]" />
        <Skeleton className="h-4 w-[60%] mt-1" />
      </CardHeader>
      <CardContent>
        <div className="flex space-x-4">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-16" />
        </div>
      </CardContent>
      <CardFooter>
        <Skeleton className="h-4 w-[40%]" />
      </CardFooter>
    </Card>
  )
} 