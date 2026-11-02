/** Bounded RFC 4180-style CSV parser. Logical row numbers match import preview rows. */
export function parseRegistryCsv(source: string): Record<string, string>[] {
    if (new TextEncoder().encode(source).length > 1048576)
        throw new Error("Choose a CSV file smaller than 1 MiB.");
    const rows: string[][] = [];
    let row: string[] = [], field = "", quoted = false, closed = false;
    const input = source.replace(/^\uFEFF/, "");
    function cell() { row.push(field); field = ""; closed = false; }
    function line() { cell(); if (row.some(v => v !== ""))
        rows.push(row); row = []; }
    for (let i = 0; i < input.length; i++) {
        const c = input[i];
        if (quoted) {
            if (c === '"') {
                if (input[i + 1] === '"') {
                    field += '"';
                    i++;
                }
                else {
                    quoted = false;
                    closed = true;
                }
            }
            else
                field += c;
        }
        else if (c === '"' && !field && !closed)
            quoted = true;
        else if (c === ",")
            cell();
        else if (c === '\r' || c === '\n') {
            if (c === '\r' && input[i + 1] === '\n')
                i++;
            line();
        }
        else {
            if (closed || c === '"')
                throw new Error(`Malformed quoting near data row ${rows.length}.`);
            field += c;
        }
        if (rows.length > 1001)
            throw new Error("Use at most 1,000 data rows per import.");
    }
    if (quoted)
        throw new Error("A quoted field is not closed.");
    if (field || row.length || closed)
        line();
    const header = rows.shift()?.map(v => v.trim());
    if (!header?.length || header.some(v => !v) || new Set(header).size !== header.length)
        throw new Error("CSV needs unique, nonempty column headers.");
    if (!rows.length || rows.length > 1000)
        throw new Error("Use 1 to 1,000 data rows.");
    return rows.map((values, index) => {
        if (values.length !== header.length)
            throw new Error(`Data row ${index + 1} has ${values.length} columns; expected ${header.length}.`);
        return Object.fromEntries(header.flatMap((key, i) => values[i] === "" ? [] : [[key, values[i]]]));
    });
}
export const importTemplates: Record<string, string> = {
    property: "community_code,location_code,code,label,kind,lot_area_sqm,floor_area_sqm,ownership_share\nPRIMARY,BLOCK-1,P-001,Sample lot,lot,100.0000,,\n",
    person: "external_key,name,kind,email\nPERSON-001,Sample resident,individual,sample@example.test\n",
    asset: "community_code,location_code,code,label,kind,capacity\nPRIMARY,BLOCK-1,PARK-001,Sample parking,parking,1\n",
    relationship: "community_code,property_code,person_key,kind,valid_from,valid_until,primary_contact,billing_contact\nPRIMARY,P-001,PERSON-001,owner,,,false,false\n",
};
