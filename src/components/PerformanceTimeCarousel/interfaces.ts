import {Performance} from 'api/FetchPerformanceList';

export interface PerformanceTimeCarouselProps {
  date: Date;
  onSelect?: (item: Performance) => void;
  filmId: number;
  selected?: Performance | null;
  cinema: string;
}

export interface PerformanceTimeCarouselState {
  isPending: boolean;
  page: number;
  nextPage: number | null;
  list: Array<Performance>;
  errorMessage: string | null;
}
