const Rx = require('rxjs');

const table = document.getElementById('main_table');
const mousedown$ = Rx.Observable.fromEvent(table, 'mousedown').filter(e => e.target.nodeName === 'TD');
const mousemove$ = Rx.Observable.fromEvent(document, 'mousemove').filter(e => e.target.nodeName === 'TD');
const mouseup$ = Rx.Observable.fromEvent(document, 'mouseup');

const dragDrop$ = mousedown$.switchMap(() => mousemove$.takeUntil(mouseup$));

renderTable(table);

mousedown$
    .subscribe(e => {
        dragDrop$
            .scan((acc, e) => {
                const pos = getPosition(e.target);
                if (!acc) {
                    return { startRow: pos.row, startColumn: pos.column, endRow: pos.row, endColumn: pos.column };
                } else {
                    return Object.assign(acc, { endRow: pos.row, endColumn: pos.column });
                }
            }, null)
            .subscribe(range => {
                const startRow = Math.min(range.startRow, range.endRow);
                const startColumn = Math.min(range.startColumn, range.endColumn);
                const endRow = Math.max(range.startRow, range.endRow);
                const endColumn = Math.max(range.startColumn, range.endColumn);
                const { top, left } = document.getElementById(`cell-${startRow}-${startColumn}`).getBoundingClientRect();
                const { bottom, right } = document.getElementById(`cell-${endRow}-${endColumn}`).getBoundingClientRect();
                const selectionEl = document.getElementById('selection');
                selectionEl.style.top = `${top - 2}px`;
                selectionEl.style.left = `${left - 2}px`;
                selectionEl.style.height = `${bottom - top + 3}px`;
                selectionEl.style.width = `${right - left + 3}px`;
            });
    });



function renderTable(table) {
    const column = Array(10).fill(1).map((n, i) => i + 1);
    const row = Array(20).fill(1).map((n, i) => i + 1);
    const frag = document.createDocumentFragment();
    
    row.forEach(i => {
        const tr = document.createElement('tr');
        tr.id = 'row-' + i;
        column.forEach(j => {
            const td = document.createElement('td');
            td.id = `cell-${i}-${j}`;
            td.setAttribute('data-row', i);
            td.setAttribute('data-column', j);
            tr.appendChild(td);
        });
        frag.appendChild(tr);
    });
    table.appendChild(frag);
}

function getPosition(el) {
    return {
        row: parseInt(el.getAttribute('data-row')),
        column: parseInt(el.getAttribute('data-column')),
    };
}