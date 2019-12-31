import { canonicalEntityView } from './canonical-entity'
import { briefEntityView } from './brief-entity'

const entityViews = {
  canonical: canonicalEntityView,
  brief: briefEntityView
}

export const entityView = schemaRegistry => type =>
  entityViews[type || 'canonical'](schemaRegistry)
