import { Knex } from 'knex';

const TABLE = 'users';

export async function up(knex: Knex): Promise<void> {
    await knex.schema.table(TABLE, (table) => {
        table.string('preferred_language').nullable();
    });
}

export async function down(knex: Knex): Promise<void> {
    await knex.schema.table(TABLE, (table) => {
        table.dropColumn('preferred_language');
    });
}
