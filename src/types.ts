interface City {
    id: string;
    name: string;
    ascii: string;
    alt_name: string;
    lat: string;
    long: string;
    feat_class: string;
    feat_code: string;
    country: string;
    cc2: string;
    admin1: string;
    admin2: string;
    admin3: string;
    admin4: string;
    population: string;
    elevation: string;
    dem: string;
    tz: string;
    modified_at: string;
}

interface CitySuggestion {
    name: string;
    latitude: string;
    longitude: string;
    score: number;
}

interface Suggestions {
    suggestions: CitySuggestion[];
}

interface Location {
    latitude: number;
    longitude: number;
}

export { 
    City, 
    CitySuggestion, 
    Suggestions,
    Location
};