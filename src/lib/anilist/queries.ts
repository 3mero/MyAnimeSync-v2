export const MEDIA_FRAGMENT_CORE = `
  id
  idMal
  title { romaji english native }
  coverImage { extraLarge large color }
  episodes
  chapters
  volumes
  averageScore
  genres
  tags {
    id
    name
  }
  type
  format
  status
  popularity
  seasonYear
  startDate { year month day }
  isAdult
  description(asHtml: false)
`;

export const MEDIA_FRAGMENT_DETAILS = `
  source
  trailer { id site }
  rankings {
    rank
    allTime
  }
  studios(isMain: true) {
      nodes {
        id
        name
      }
  }
  staff(sort: [RELEVANCE, ROLE]) {
    edges {
      role
      node {
        id
        name {
          full
        }
        image {
          large
        }
      }
    }
  }
`;

export const RELATIONS_FRAGMENT = `
  relations {
    edges {
      relationType(version: 2)
      node {
        ...mediaFieldsCore
      }
    }
  }
`;

export const HOME_PAGE_QUERY = `
query HomePageQuery($currentYear: Int, $currentSeason: MediaSeason, $genre_not_in: [String], $tag_not_in: [String]) {
  trending: Page(page: 1, perPage: 10) {
    media(sort: TRENDING_DESC, type: ANIME, isAdult: false, genre_not_in: $genre_not_in, tag_not_in: $tag_not_in) { ...mediaFieldsCore }
  }
  topThisSeason: Page(page: 1, perPage: 10) {
    media(sort: SCORE_DESC, type: ANIME, season: $currentSeason, seasonYear: $currentYear, isAdult: false, genre_not_in: $genre_not_in, tag_not_in: $tag_not_in) { ...mediaFieldsCore }
  }
  airing: Page(page: 1, perPage: 10) {
    media(sort: POPULARITY_DESC, type: ANIME, status: RELEASING, isAdult: false, genre_not_in: $genre_not_in, tag_not_in: $tag_not_in) { ...mediaFieldsCore }
  }
  top: Page(page: 1, perPage: 10) {
    media(sort: SCORE_DESC, type: ANIME, isAdult: false, genre_not_in: $genre_not_in, tag_not_in: $tag_not_in) { ...mediaFieldsCore }
  }
  popular: Page(page: 1, perPage: 10) {
     media(sort: POPULARITY_DESC, type: ANIME, isAdult: false, genre_not_in: $genre_not_in, tag_not_in: $tag_not_in) { ...mediaFieldsCore }
  }
  upcoming: Page(page: 1, perPage: 10) {
    media(sort: POPULARITY_DESC, type: ANIME, status: NOT_YET_RELEASED, isAdult: false, genre_not_in: $genre_not_in, tag_not_in: $tag_not_in) { ...mediaFieldsCore }
  }
  movies: Page(page: 1, perPage: 10) {
    media(sort: POPULARITY_DESC, type: ANIME, format: MOVIE, isAdult: false, genre_not_in: $genre_not_in, tag_not_in: $tag_not_in) { ...mediaFieldsCore }
  }
  topMovies: Page(page: 1, perPage: 10) {
    media(sort: SCORE_DESC, type: ANIME, format: MOVIE, isAdult: false, genre_not_in: $genre_not_in, tag_not_in: $tag_not_in) { ...mediaFieldsCore }
  }
  trendingManga: Page(page: 1, perPage: 10) {
    media(sort: TRENDING_DESC, type: MANGA, isAdult: false, genre_not_in: $genre_not_in, tag_not_in: $tag_not_in) { ...mediaFieldsCore }
  }
  popularManga: Page(page: 1, perPage: 10) {
    media(sort: POPULARITY_DESC, type: MANGA, isAdult: false, genre_not_in: $genre_not_in, tag_not_in: $tag_not_in) { ...mediaFieldsCore }
  }
  topManga: Page(page: 1, perPage: 10) {
    media(sort: SCORE_DESC, type: MANGA, isAdult: false, genre_not_in: $genre_not_in, tag_not_in: $tag_not_in) { ...mediaFieldsCore }
  }
  releasingManga: Page(page: 1, perPage: 10) {
    media(sort: POPULARITY_DESC, type: MANGA, status: RELEASING, isAdult: false, genre_not_in: $genre_not_in, tag_not_in: $tag_not_in) { ...mediaFieldsCore }
  }
  upcomingManga: Page(page: 1, perPage: 10) {
    media(sort: POPULARITY_DESC, type: MANGA, status: NOT_YET_RELEASED, isAdult: false, genre_not_in: $genre_not_in, tag_not_in: $tag_not_in) { ...mediaFieldsCore }
  }
  latestAdditions: Page(page: 1, perPage: 10) {
    media(sort: ID_DESC, isAdult: false, genre_not_in: $genre_not_in, tag_not_in: $tag_not_in) { ...mediaFieldsCore }
  }
}
fragment mediaFieldsCore on Media { ${MEDIA_FRAGMENT_CORE} }
`;

export const MULTIPLE_ANIME_QUERY = `
query ($ids: [Int], $genre_not_in: [String], $tag_not_in: [String]) {
  Page(page: 1, perPage: 50) {
    media(id_in: $ids, genre_not_in: $genre_not_in, tag_not_in: $tag_not_in) {
      ...mediaFieldsCore
    }
  }
}
fragment mediaFieldsCore on Media { ${MEDIA_FRAGMENT_CORE} }
`;

export const MEDIA_RELATIONS_QUERY = `
query MediaRelations($id: Int, $genre_not_in: [String], $tag_not_in: [String]) {
  Media(id: $id) {
    relations {
      edges {
        relationType(version: 2)
        node {
          ...mediaFieldsCore
        }
      }
    }
  }
}
fragment mediaFieldsCore on Media { ${MEDIA_FRAGMENT_CORE} }
`;


export const MEDIA_BY_ID_QUERY = `
query MediaById($id: Int, $genre_not_in: [String], $tag_not_in: [String]) {
  Media(id: $id, genre_not_in: $genre_not_in, tag_not_in: $tag_not_in) {
    ...mediaFieldsCore
    ...mediaFragmentDetails
    ... on Media {
      nextAiringEpisode {
        airingAt
        timeUntilAiring
        episode
      }
      airingSchedule(notYetAired: true, perPage: 1) {
        nodes {
          airingAt
        }
      }
    }
  }
}
fragment mediaFieldsCore on Media { ${MEDIA_FRAGMENT_CORE} }
fragment mediaFragmentDetails on Media { ${MEDIA_FRAGMENT_DETAILS} }
`;

export const PAGINATED_LIST_QUERY = `
query PaginatedListQuery($page: Int, $perPage: Int, $sort: [MediaSort], $type: MediaType, $format: MediaFormat, $isAdult: Boolean, $genre_not_in: [String], $tag_not_in: [String]) {
  Page(page: $page, perPage: $perPage) {
    pageInfo { hasNextPage }
    media(sort: $sort, type: $type, format: $format, isAdult: $isAdult, genre_not_in: $genre_not_in, tag_not_in: $tag_not_in) { ...mediaFieldsCore }
  }
}
fragment mediaFieldsCore on Media { ${MEDIA_FRAGMENT_CORE} }
`;

export const LATEST_MOVIES_QUERY = `
query LatestMoviesQuery($page: Int, $perPage: Int, $isAdult: Boolean, $genre_not_in: [String], $tag_not_in: [String]) {
  Page(page: $page, perPage: $perPage) {
    pageInfo { hasNextPage }
    media(sort: [START_DATE_DESC], type: ANIME, format: MOVIE, isAdult: $isAdult, genre_not_in: $genre_not_in, tag_not_in: $tag_not_in) { ...mediaFieldsCore }
  }
}
fragment mediaFieldsCore on Media { ${MEDIA_FRAGMENT_CORE} }`;

export const AIRING_QUERY = `
query AiringQuery($page: Int, $perPage: Int, $isAdult: Boolean, $genre_not_in: [String], $tag_not_in: [String]) {
  Page(page: $page, perPage: $perPage) {
    pageInfo { hasNextPage }
    media(sort: [POPULARITY_DESC], type: ANIME, status: RELEASING, isAdult: $isAdult, genre_not_in: $genre_not_in, tag_not_in: $tag_not_in) { ...mediaFieldsCore }
  }
}
fragment mediaFieldsCore on Media { ${MEDIA_FRAGMENT_CORE} }`;

export const UPCOMING_QUERY = `
query UpcomingQuery($page: Int, $perPage: Int, $isAdult: Boolean, $genre_not_in: [String], $tag_not_in: [String]) {
  Page(page: $page, perPage: $perPage) {
    pageInfo { hasNextPage }
    media(sort: [POPULARITY_DESC], type: ANIME, status: NOT_YET_RELEASED, isAdult: $isAdult, genre_not_in: $genre_not_in, tag_not_in: $tag_not_in) { ...mediaFieldsCore }
  }
}
fragment mediaFieldsCore on Media { ${MEDIA_FRAGMENT_CORE} }`;

export const TOP_THIS_SEASON_QUERY = `
query TopThisSeasonQuery($page: Int, $perPage: Int, $season: MediaSeason, $seasonYear: Int, $isAdult: Boolean, $genre_not_in: [String], $tag_not_in: [String]) {
  Page(page: $page, perPage: $perPage) {
    pageInfo { hasNextPage }
    media(sort: [SCORE_DESC], type: ANIME, season: $season, seasonYear: $seasonYear, isAdult: $isAdult, genre_not_in: $genre_not_in, tag_not_in: $tag_not_in) { ...mediaFieldsCore }
  }
}
fragment mediaFieldsCore on Media { ${MEDIA_FRAGMENT_CORE} }`;

export const MANGA_STATUS_QUERY = `
query MangaStatusQuery($page: Int, $perPage: Int, $status: MediaStatus, $isAdult: Boolean, $genre_not_in: [String], $tag_not_in: [String]) {
  Page(page: $page, perPage: $perPage) {
    pageInfo { hasNextPage }
    media(sort: [POPULARITY_DESC], type: MANGA, status: $status, isAdult: $isAdult, genre_not_in: $genre_not_in, tag_not_in: $tag_not_in) { ...mediaFieldsCore }
  }
}
fragment mediaFieldsCore on Media { ${MEDIA_FRAGMENT_CORE} }`;

export const EPISODES_QUERY = `
query EpisodesQuery($id: Int) {
  Media(id: $id) {
    streamingEpisodes {
      title
      thumbnail
      url
      site
    }
  }
}
`;

export const SEASON_MEDIA_QUERY = `
query SeasonMediaQuery(
    $page: Int, $perPage: Int, 
    $season: MediaSeason, $seasonYear: Int, 
    $type: MediaType, $format_in: [MediaFormat],
    $genre_not_in: [String], $tag_not_in: [String]
) {
  Page(page: $page, perPage: $perPage) {
    pageInfo { hasNextPage }
    media(
        season: $season, seasonYear: $seasonYear, 
        type: $type, format_in: $format_in, 
        sort: [POPULARITY_DESC],
        genre_not_in: $genre_not_in,
        tag_not_in: $tag_not_in
    ) {
      ...mediaFieldsCore
    }
  }
}
fragment mediaFieldsCore on Media { ${MEDIA_FRAGMENT_CORE} }
`;

export const RECOMMENDATIONS_QUERY = `
query RecommendationsQuery($id: Int) {
  Media(id: $id) {
    recommendations(sort: [RATING_DESC, ID], perPage: 25) {
      edges {
        node {
          mediaRecommendation {
            ...mediaFieldsCore
          }
        }
      }
    }
  }
}
fragment mediaFieldsCore on Media { ${MEDIA_FRAGMENT_CORE} }
`;

export const CHARACTERS_QUERY = `
query CharactersQuery($id: Int!) {
  Media(id: $id) {
    characters(sort: [ROLE, RELEVANCE, ID], perPage: 25) {
      edges {
        role
        node { # Character
          id
          name {
            full
          }
          image {
            large
          }
          favourites
        }
        voiceActors(language: JAPANESE, sort: [RELEVANCE, ID]) { # Staff
          id
          name {
            full
          }
          image {
            large
          }
        }
      }
    }
  }
}
`;
export const STAFF_QUERY = `
query StaffQuery($id: Int) {
    Media(id: $id) {
        staff(sort: [RELEVANCE, ID], perPage: 24) {
            edges {
                role
                node {
                    id
                    name { full }
                    image { large }
                }
            }
        }
    }
}
`;

export const REVIEWS_QUERY = `
query ReviewsQuery($id: Int) {
    Media(id: $id) {
        reviews(sort: [RATING_DESC, ID], perPage: 25) {
            nodes {
                id
                summary
                body(asHtml: false)
                rating
                ratingAmount
                score
                createdAt
                user {
                    id
                    name
                    avatar { large }
                }
            }
        }
    }
}
`;

export const NEWS_QUERY = `
query NewsQuery($mediaId: Int) {
  Page(page: 1, perPage: 10) {
    airingSchedules(mediaId: $mediaId, sort: TIME_DESC) {
      media {
        id
        title { romaji }
        coverImage { large }
      }
      episode
      airingAt
    }
  }
}
`;

export const PICTURES_QUERY = `
query PicturesQuery($id: Int) {
  Media(id: $id) {
    bannerImage
    coverImage { extraLarge }
  }
}
`;

export const VIDEOS_QUERY = `
query VideosQuery($id: Int) {
  Media(id: $id) {
    trailer { id, site, thumbnail }
    streamingEpisodes { title, thumbnail, url, site }
  }
}
`;

export const SEASONS_QUERY = `
    query SeasonsQuery {
        SeasonList: Page(page: 1, perPage: 50) {
            media(sort: START_DATE_DESC, type: ANIME, status_in: [RELEASING, FINISHED]) {
                season
                seasonYear
            }
        }
    }
`;

export const LATEST_RECS_QUERY = `
  query LatestRecommendationsQuery($page: Int, $perPage: Int) {
    Page(page: $page, perPage: $perPage) {
      pageInfo { hasNextPage }
      recommendations(sort: [ID_DESC]) {
        id
        rating
        userRating
        content: user { name } # Placeholder, AniList doesn't provide recommendation content text
        mediaRecommendation { ...mediaFieldsCore }
        media { ...mediaFieldsCore }
      }
    }
  }
  fragment mediaFieldsCore on Media { ${MEDIA_FRAGMENT_CORE} }
`;

export const MEDIA_COUNTS_QUERY = `
    query MediaCountsQuery($ids: [Int]) {
      Page(page: 1, perPage: 50) {
        media(id_in: $ids) {
          id
          episodes
          chapters
          volumes
        }
      }
    }
`;

export const SEARCH_QUERY = `
query Search(
  $page: Int,
  $perPage: Int,
  $search: String,
  $type: MediaType,
  $sort: [MediaSort],
  $format: [MediaFormat],
  $status: MediaStatus,
  $countryOfOrigin: CountryCode,
  $source: [MediaSource],
  $season: MediaSeason,
  $seasonYear: Int,
  $year: String,
  $onList: Boolean,
  $yearLesser: FuzzyDateInt,
  $yearGreater: FuzzyDateInt,
  $episodeLesser: Int,
  $episodeGreater: Int,
  $chapterLesser: Int,
  $chapterGreater: Int,
  $volumeLesser: Int,
  $volumeGreater: Int,
  $licensedBy: [String],
  $isAdult: Boolean,
  $genre_in: [String],
  $genre_not_in: [String],
  $tag_in: [String],
  $tag_not_in: [String],
  $minimumTagRank: Int,
  $licensedById_in: [Int]
) {
  Page(page: $page, perPage: $perPage) {
    pageInfo {
      total
      perPage
      currentPage
      lastPage
      hasNextPage
    }
    media(
      search: $search
      type: $type
      sort: $sort
      format_in: $format
      status: $status
      countryOfOrigin: $countryOfOrigin
      source_in: $source
      season: $season
      seasonYear: $seasonYear
      startDate_like: $year
      onList: $onList
      startDate_lesser: $yearLesser
      startDate_greater: $yearGreater
      episodes_lesser: $episodeLesser
      episodes_greater: $episodeGreater
      chapters_lesser: $chapterLesser
      chapters_greater: $chapterGreater
      volumes_lesser: $volumeLesser
      volumes_greater: $volumeGreater
      licensedBy_in: $licensedBy
      isAdult: $isAdult
      genre_in: $genre_in
      genre_not_in: $genre_not_in
      tag_in: $tag_in
      tag_not_in: $tag_not_in
      minimumTagRank: $minimumTagRank
      licensedById_in: $licensedById_in
    ) {
      ...mediaFieldsCore
    }
  }
}
fragment mediaFieldsCore on Media { ${MEDIA_FRAGMENT_CORE} }
`;

export const PERSON_DETAILS_QUERY = `
    query PersonDetailsQuery($id: Int) {
        Staff(id: $id) {
            id
            name { full native }
            image { large }
            description(asHtml: true)
            favourites
            primaryOccupations
            dateOfBirth { year month day }
            characterMedia(sort: POPULARITY_DESC, perPage: 20) {
                edges {
                    characterRole
                    node { # Media
                        id
                        idMal
                        title { romaji english }
                        type
                        format
                        coverImage { large }
                        startDate { year }
                    }
                    characters { # Character
                        id
                        name { full }
                        image { large }
                    }
                }
            }
        }
    }
`;

export const CHARACTER_DETAILS_QUERY = `
    query CharacterDetailsQuery($id: Int) {
        Character(id: $id) {
            id
            name { full native }
            image { large }
            description(asHtml: false)
            favourites
            media(sort: POPULARITY_DESC, perPage: 50) {
                edges {
                    characterRole
                    node {
                        id
                        idMal
                        title { romaji english }
                        coverImage { large }
                        type
                        format
                    }
                }
            }
        }
    }
`;

export const CHAR_PICS_QUERY = `query ($id: Int) { Character(id: $id) { image { large } } }`;
export const PERSON_PICS_QUERY = `query ($id: Int) { Staff(id: $id) { image { large } } }`;

export const MANGA_CHARS_QUERY = `
    query MangaCharactersQuery($id: Int) {
      Media(id: $id, type: MANGA) {
        characters(sort: [ROLE, RELEVANCE, ID]) {
          edges {
            role
            node {
              id
              name { full }
              image { large }
            }
          }
        }
      }
    }
`;

export const SEARCH_CHARACTERS_QUERY = `
query SearchCharacters($search: String) {
  Page(page: 1, perPage: 10) {
    characters(search: $search, sort: [SEARCH_MATCH, FAVOURITES_DESC]) {
      id
      name {
        full
      }
      image {
        large
      }
    }
  }
}
`;


export const SEARCH_BY_MAL_ID_QUERY = `
    query ($malIds: [Int], $page: Int, $perPage: Int) {
        Page(page: $page, perPage: $perPage) {
            pageInfo { total }
            media(idMal_in: $malIds, sort: POPULARITY_DESC) {
                ...mediaFieldsCore
            }
        }
    }
    fragment mediaFieldsCore on Media { ${MEDIA_FRAGMENT_CORE} }
`;

export const GLOBAL_ACTIVITY_QUERY_LEGACY = `
query GlobalActivityQuery($page: Int, $perPage: Int) {
  Page(page: $page, perPage: $perPage) {
    pageInfo {
      total
      currentPage
      lastPage
      hasNextPage
    }
    activities(sort: ID_DESC) {
      ... on ListActivity {
        id
        type
        status
        progress
        createdAt
        user {
          id
          name
          avatar {
            large
          }
        }
        media {
          id
          idMal
          type
          format
          episodes
          chapters
          status
          title {
            romaji
            english
          }
          coverImage {
            large
          }
        }
      }
    }
  }
}
`;
