import type { ShownPrice } from '@/entities/course'
import type { CatalogCourse, Listing } from '@/entities/course/server'
import type { Rating } from '@/entities/review'
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/shared/ui/empty'
import { Icon } from '@/shared/ui/icon'
import { getT } from '@/shared/i18n/server'
import { CATALOG_PAGE, catalogFacets, filterCatalog, isFiltered, readCatalogQuery } from '../lib/filter'
import { CatalogFilters } from './CatalogFilters'
import { CatalogGrid } from './CatalogGrid'
import { ResetFilters, ShowMore } from './ShowMore'

type Item = { course: CatalogCourse; price: ShownPrice; rating: Rating; listing: Listing }

/**
 * The marketplace with search and filters (public /catalog and students' /explore): reads them from
 * the address, filters every listed course on the server, shows the first `show` (24 per page).
 */
export async function CatalogBrowser({
  items,
  searchParams,
  hrefBase,
  end,
}: {
  items: Item[]
  searchParams: Record<string, string | string[] | undefined>
  hrefBase: string
  end?: React.ReactNode
}) {
  const query = readCatalogQuery(searchParams)
  const facets = catalogFacets(items)
  const found = filterCatalog(items, query)
  const t = await getT()
  return (
    <div className="flex flex-col gap-6">
      {items.length > 0 && (
        <CatalogFilters
          query={query}
          subjects={facets.subjects}
          languages={facets.languages}
          prices={{ free: facets.hasFree, paid: facets.hasPaid }}
          found={found.length}
          end={end}
        />
      )}
      {items.length > 0 && found.length === 0 && isFiltered(query) ? (
        <Empty className="bg-foreground/3 rounded-2xl">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Icon name="search" />
            </EmptyMedia>
            <EmptyTitle>{t.shop.filter.noMatch}</EmptyTitle>
            <EmptyDescription>{t.shop.filter.noMatchSub}</EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <ResetFilters />
          </EmptyContent>
        </Empty>
      ) : (
        <CatalogGrid items={found.slice(0, query.show)} hrefBase={hrefBase} />
      )}
      {found.length > query.show && <ShowMore next={query.show + CATALOG_PAGE} />}
    </div>
  )
}
