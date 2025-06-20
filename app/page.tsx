import Link from 'next/link';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const projects = ['Project A', 'Project B', 'Project C'];

export default function Page() {
  return (
    <div className="grid gap-4 p-4 sm:grid-cols-2 lg:grid-cols-3">
      {projects.map((name, i) => (
        <Card key={name}>
          <CardContent className="flex h-32 items-center justify-center bg-muted">
            <span className="text-sm text-muted-foreground">Thumbnail {i + 1}</span>
          </CardContent>
          <CardFooter className="justify-between">
            <span className="font-medium">{name}</span>
            <Button asChild size="sm">
              <Link href={`/projects/${i}`}>Enter</Link>
            </Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}
