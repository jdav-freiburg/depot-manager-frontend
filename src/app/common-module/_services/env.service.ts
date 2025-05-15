import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';

export interface EnvInfo {
    apiUrl?: string;
    deviceApiUrl?: string;
    oicdIssuer?: string;
    oicdClientId?: string;
}

export function getEnv(): EnvInfo {
    const browserWindow = window || {};
    const browserWindowEnv = browserWindow['__env'] || {};
    return browserWindowEnv;
}

export function getApiUrl(): string {
    const env = getEnv();
    return env.apiUrl || '/api';
}

export function getDeviceApiUrl(): string {
    const env = getEnv();
    return env.deviceApiUrl || '/api';
}

@Injectable({
    providedIn: 'root',
})
export class EnvService {
    private _env: EnvInfo;

    public get apiUrl(): string {
        return this._env.apiUrl || '/api';
    }

    public get deviceApiUrl(): string {
        return this._env.deviceApiUrl || '/api';
    }

    public get oicdIssuer(): string {
        return this._env.oicdIssuer || 'http://127.0.0.1:8000';
    }

    public get oicdClientId(): string {
        return this._env.oicdClientId || 'depot';
    }

    constructor() {
        this._env = getEnv();
    }
}
