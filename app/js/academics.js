import { supabase } from './lib/supabase.js';
import { escapeHTML } from './lib/security.js';
import { schemaHint } from './lib/format.js';


const grid =
    document.querySelector(
        '#academicGrid'
    );

const status =
    document.querySelector(
        '#academicStatus'
    );

const search =
    document.querySelector(
        '#academicSearch'
    );

const department =
    document.querySelector(
        '#academicDepartment'
    );


function card(resource) {

    const image =
        resource.image_urls?.[0];

    return `
        <article class="card resource-card">

            ${
                image
                    ? `
                        <div class="card-media">
                            <img
                                src="${escapeHTML(image)}"
                                alt=""
                            >
                        </div>
                    `
                    : ''
            }

            <div class="card-content">

                <div class="row">

                    <span class="chip">
                        ${escapeHTML(
                            resource.department
                        )}
                    </span>

                    ${
                        resource.course_code
                            ? `
                                <span class="muted">
                                    ${escapeHTML(
                                        resource.course_code
                                    )}
                                </span>
                            `
                            : ''
                    }

                </div>


                <h3>
                    ${escapeHTML(
                        resource.title
                    )}
                </h3>


                <p class="muted">
                    ${
                        resource.academic_year
                            ? escapeHTML(
                                resource.academic_year
                              )
                            : 'Academic resource'
                    }
                </p>


                <div class="uploader">

                    <span class="avatar">
                        ${escapeHTML(
                            (
                                resource.profiles
                                    ?.full_name ||
                                'Student'
                            )
                                .charAt(0)
                                .toUpperCase()
                        )}
                    </span>

                    <span>
                        Uploaded by
                        <strong>
                            ${escapeHTML(
                                resource.profiles
                                    ?.full_name ||
                                'Student'
                            )}
                        </strong>
                    </span>

                </div>


                <a
                    class="btn btn-secondary"
                    href="${escapeHTML(
                        resource.file_url
                    )}"
                    target="_blank"
                    rel="noopener"
                >
                    Open resource
                </a>

            </div>

        </article>
    `;
}


async function load() {

    if (!grid) {
        return;
    }

    status.textContent =
        'Loading resources...';


    let query =
        supabase
            .from('academic_resources')
            .select(`
                *,
                profiles:uploaded_by (
                    full_name,
                    reg_number
                )
            `)
            .order(
                'created_at',
                {
                    ascending: false
                }
            )
            .limit(60);


    const term =
        search?.value
            ?.trim()
            .replace(/[%(),]/g, '')
            .slice(0, 80);


    if (term) {

        query =
            query.or(
                `title.ilike.%${term}%,course_code.ilike.%${term}%,department.ilike.%${term}%`
            );
    }


    if (
        department?.value
    ) {

        query =
            query.eq(
                'department',
                department.value
            );
    }


    const {
        data,
        error
    } = await query;


    if (error) {

        console.error(error);

        status.textContent =
            schemaHint(error);

        grid.innerHTML = '';

        return;
    }


    if (!data?.length) {

        status.textContent =
            'No academic resources found.';

        grid.innerHTML = `
            <div class="empty">
                No resources match your search.
            </div>
        `;

        return;
    }


    status.textContent =
        `${data.length} resource${
            data.length === 1
                ? ''
                : 's'
        }`;


    grid.innerHTML =
        data
            .map(card)
            .join('');
}


let timer;

search?.addEventListener(
    'input',
    () => {

        clearTimeout(timer);

        timer =
            setTimeout(
                load,
                250
            );
    }
);


department?.addEventListener(
    'change',
    load
);


load();