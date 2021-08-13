import {Performance, Film} from 'api/FetchPerformanceList';

export interface PerformanceCarouselProps {
  date?: Date;
  onSelect?: (item: Performance) => void;
  cinema?: string;
  onWillFetch?: () => void;
}

export interface PerformanceCarouselState {
  isPending: boolean;
  page: number;
  nextPage: number | null;
  list: Array<Performance>;
  errorMessage: string | null;
  filmList:Array<Film>;
}
