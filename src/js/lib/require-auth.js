import {
    getCurrentSession
} from './auth-bootstrap.js';


export async function requireAuth() {

    const session =
        await getCurrentSession();


    if (!session) {

        const currentPage =
            window.location.pathname;


        const returnUrl =
            encodeURIComponent(
                currentPage
            );


        window.location.href =
            `login.html?redirect=${returnUrl}`;


        return false;
    }


    return true;
}