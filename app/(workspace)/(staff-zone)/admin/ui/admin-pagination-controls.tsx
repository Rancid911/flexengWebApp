"use client";

import { Button } from "@/components/ui/button";

type PaginationProps = {
  page: number;
  pageCount: number;
  onFirst: () => void;
  onPrev: () => void;
  onNext: () => void;
  onLast: () => void;
};

export function AdminPaginationControls({ page, pageCount, onFirst, onPrev, onNext, onLast }: PaginationProps) {
  return (
    <div className="flex items-center justify-between pt-2">
      <Button variant="secondary" onClick={onFirst} type="button" disabled={page <= 1}>
        Первая
      </Button>
      <Button variant="secondary" onClick={onPrev} type="button" disabled={page <= 1}>
        Влево
      </Button>
      <p className="text-sm text-muted-foreground">
        Страница {page} / {pageCount}
      </p>
      <Button variant="secondary" onClick={onNext} type="button" disabled={page >= pageCount}>
        Вправо
      </Button>
      <Button variant="secondary" onClick={onLast} type="button" disabled={page >= pageCount}>
        Последняя
      </Button>
    </div>
  );
}
