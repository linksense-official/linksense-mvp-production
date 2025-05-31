// Next.js Navigation Mock for Jest
// Next.js の navigation 機能をテスト用にモックします

const mockRouter = {
  push: jest.fn().mockResolvedValue(true),
  replace: jest.fn().mockResolvedValue(true),
  prefetch: jest.fn().mockResolvedValue(),
  back: jest.fn(),
  forward: jest.fn(),
  refresh: jest.fn(),
  pathname: '/',
  route: '/',
  query: {},
  asPath: '/',
  basePath: '',
  isLocaleDomain: true,
  isReady: true,
  isPreview: false,
  isFallback: false,
  events: {
    on: jest.fn(),
    off: jest.fn(),
    emit: jest.fn(),
  },
}

const mockSearchParams = {
  get: jest.fn().mockReturnValue(null),
  getAll: jest.fn().mockReturnValue([]),
  has: jest.fn().mockReturnValue(false),
  keys: jest.fn().mockReturnValue([]),
  values: jest.fn().mockReturnValue([]),
  entries: jest.fn().mockReturnValue([]),
  forEach: jest.fn(),
  toString: jest.fn().mockReturnValue(''),
  size: 0,
}

const mockPathname = '/'

module.exports = {
  useRouter: jest.fn(() => mockRouter),
  useSearchParams: jest.fn(() => mockSearchParams),
  usePathname: jest.fn(() => mockPathname),
  useParams: jest.fn(() => ({})),
  
  // Next.js App Router hooks
  notFound: jest.fn(),
  redirect: jest.fn(),
  permanentRedirect: jest.fn(),
  
  // Router mock for direct import
  router: mockRouter,
  
  // ReadonlyURLSearchParams mock
  ReadonlyURLSearchParams: jest.fn().mockImplementation(() => mockSearchParams),
}

// Legacy router support
module.exports.withRouter = (Component) => {
  const WrappedComponent = (props) => {
    return Component({ ...props, router: mockRouter })
  }
  WrappedComponent.displayName = `withRouter(${Component.displayName || Component.name})`
  return WrappedComponent
}