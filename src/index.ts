import express from 'express';
const { readFileSync } = require('fs');
import { City, CitySuggestion, Suggestions, Location } from './types';

class App {

    private readonly PORT = 3000;
    private readonly MAX_SUGGESTIONS = 20;
    private readonly MAX_DISTANCE = -1; // -1 means no limit
    private readonly FILE_CITYS = '../data/cities_canada-usa.json';

    // weights for score calculation
    private readonly WEIGHT_NAME = 0.5;
    private readonly WEIGHT_LOCATION = 0.5;

    private cities: City[];
    private app: express.Application;

    constructor() {
        const jsonFileData = readFileSync(this.FILE_CITYS);
        this.cities = JSON.parse(jsonFileData.toString());
        this.app = express();
    }

    private needsServerStarted() {
        if (!this.app) throw new Error("Server is not started yet");
    }

    public start() {
        this.createEndpoints();

        this.app.listen(this.PORT, () => {
            console.log('Server is running on port '+ this.PORT);
        });
    };

    private createEndpoints() {
        this.needsServerStarted();
        this.app.get('/', (req: express.Request, res: express.Response) => {
            res.send('Hello World');
        });

        this.app.get('/suggestions', (req: any, res: any) => {
            let q = req.query.q;
            let latitude = req.query.latitude || undefined;
            let longitude = req.query.longitude || undefined;

            if (!q) res.status(400).send("q parameter is required");

            let suggestions = this.getSuggestions(q.toString(), latitude, longitude);

            res.send(suggestions);
        });
    }

    public getSuggestions(q: string, latitude?: string, longitude?: string): Suggestions {
        let suggestions: Suggestions = { suggestions: [] };
        let origin: Location = { latitude: 0, longitude: 0 };

        if (latitude && longitude) {
            origin.latitude = parseFloat(latitude);
            origin.longitude = parseFloat(longitude);
        }

        // filter cities
        let filteredCities = this.cities.filter(city => {
            if (typeof city.name !== 'string') return false;
            return city.name.toLowerCase().startsWith(q.toLowerCase());
        });

        // sort cities
        filteredCities.sort((a, b) => {
            let scoreA = this.calculateScore(q, a.name, { latitude: parseFloat(a.lat), longitude: parseFloat(a.long) }, origin);
            let scoreB = this.calculateScore(q, b.name, { latitude: parseFloat(b.lat), longitude: parseFloat(b.long) }, origin);
            return scoreB - scoreA;
        });

        // limit cities
        if (this.MAX_SUGGESTIONS > 0) {
            filteredCities = filteredCities.slice(0, this.MAX_SUGGESTIONS);
        }

        // map cities to suggestions
        suggestions.suggestions = filteredCities.map(city => {
            return {
                name: city.name,
                latitude: city.lat,
                longitude: city.long,
                score: this.calculateScore(q, city.name, { latitude: parseFloat(city.lat), longitude: parseFloat(city.long) }, origin)
            }
        });

        return suggestions;
    }

    protected calculateScore(q: string, name: string, dest: Location, origin: Location): number {
        let score = 0;
        score += App.calculateScoreName(q, name) * this.WEIGHT_NAME;
        score += App.calculateScoreLocation(dest.latitude, dest.longitude, origin.latitude, origin.longitude) * this.WEIGHT_LOCATION;
        return score;
    }

    protected static calculateScoreName(q: string, name: string): number {
        let score = 0;
        q = q.toLowerCase();
        name = name.toLowerCase();

        let sameChars = 0;
        for (let i = 0; i < name.length; i++) {
            if (q[i] === name[i]) {
                sameChars++;
            } else {
                break;
            }
        }

        score += sameChars / name.length;
        return score;

    }

    // ### Haversine formula | https://en.wikipedia.org/wiki/Haversine_formula | ChatGPT ###
    protected static degreesToRadians(degrees: number): number {
        return degrees * (Math.PI / 180);
    }
    
    protected static calculateScoreLocation(x_dest: number, y_dest: number, x_origin: number, y_origin: number): number {
        const earthRadiusInKm = 6371; // Average radius of the Earth in kilometers
    
        // Convert coordinates from degrees to radians
        const lat1Rad = App.degreesToRadians(y_origin);
        const lat2Rad = App.degreesToRadians(y_dest);
        const lon1Rad = App.degreesToRadians(x_origin);
        const lon2Rad = App.degreesToRadians(x_dest);
    
        // Calculating the distance using the haversine formula
        const dLat = lat2Rad - lat1Rad;
        const dLon = lon2Rad - lon1Rad;
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                  Math.cos(lat1Rad) * Math.cos(lat2Rad) *
                  Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const distanceInKm = earthRadiusInKm * c;
    
        // Normalization of the distance in relation to the radius of the Earth to obtain the score
        const maxDistanceInKm = 2 * earthRadiusInKm; // Diameter of the Earth
        const score = 1 - (distanceInKm / maxDistanceInKm);
        return Math.max(0, Math.min(1, score));
    }
    // ### End Haversine formula | ChatGPT ###
}

let app = new App();
app.start();

