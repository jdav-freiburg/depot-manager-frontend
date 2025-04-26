export function parseHttpError(err): string {
    if (!err) {
        return 'Unknown Error';
    }
    if (err.status === 0) {
        return err.statusText;
    } else if (err.error) {
        if (err.error.detail) {
            // joins the msg parts of every object in the array
            if (Array.isArray(err.error.detail)) {
                const messages = err.error.detail
                    .map((item) => item.msg || JSON.stringify(item))
                    .filter((msg) => !!msg);

                return messages.join(', ');
            }

            return JSON.stringify(err.error.detail);
        }
        return JSON.stringify(err.error);
    }
    return 'Unknown Error: ' + JSON.stringify(err);
}
