import canonicalEntityView from './canonical-entity'
import briefEntityView from './canonical-entity'

const entityViews = {
  canonical: canonicalEntityView,
  brief: briefEntityView
}

const entityView = schemaRegistry => type =>
  entityViews[type || 'canonical'](schemaRegistry)

export default entityView
