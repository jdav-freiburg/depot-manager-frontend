export function parseHttpError(err): string {
    if (!err) {
        return 'Unknown Error';
    }
    if (err.status === 0) {
        return err.statusText;
    } else if (err.error) {
        if (err.error.detail) {
            return err.error.detail.toString();
        }
        return err.error.toString();
    }
    return 'Unknown Error: ' + err.toString();
}
