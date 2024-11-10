export interface MastodonFeed {
    "?xml": Xml
    rss: Rss
  }
  
  export interface Xml {
    version: string
    encoding: string
  }
  
  export interface Rss {
    channel: Channel
    version: string
    "xmlns:webfeeds": string
    "xmlns:media": string
  }
  
  export interface Channel {
    title: string
    description: string
    link: string
    image: Image
    lastBuildDate: string
    "webfeeds:icon": string
    generator: string
    item: Item[]
  }
  
  export interface Image {
    url: string
    title: string
    link: string
  }
  
  export interface Item {
    guid: Guid
    avatar: string // Created
    link: string
    pubDate: string
    description: string
    "media:content"?: MediaContent
    category: any
    read: boolean
    reading: boolean
  }
  
  export interface Guid {
    $text: string
    isPermaLink: string
  }
  
  export interface MediaContent {
    "media:rating": MediaRating
    url: string
    type: string
    fileSize: string
    medium: string
    "media:description"?: MediaDescription
  }
  
  export interface MediaRating {
    $text: string
    scheme: string
  }
  
  export interface MediaDescription {
    $text: string
    type: string
  }
  