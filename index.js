const Rx = require('rxjs');

const table = document.getElementById('main_table');
const cellInput = document.getElementById('cell_input');
const mousedown$ = Rx.Observable.fromEvent(table, 'mousedown').filter(e => e.target.nodeName === 'TD');
const mousemove$ = Rx.Observable.fromEvent(document, 'mousemove').filter(e => e.target.nodeName === 'TD');
const mouseup$ = Rx.Observable.fromEvent(document, 'mouseup');
const click$ = Rx.Observable.fromEvent(table, 'click').filter(e => e.target.nodeName === 'TD');

renderTable(table);

const dragDrop$ = mousedown$
    .map(e => {
        return Rx.Observable.of(e).switchMap(() => mousemove$.takeUntil(mouseup$))
            .startWith(e)
            .map(e => getPosition(e.target))
            .distinctUntilChanged((p, q) => isPositionEqual(p, q))
            .scan((acc, pos) => {
                if (!acc) {
                    return { startRow: pos.row, startColumn: pos.column, endRow: pos.row, endColumn: pos.column };
                } else {
                    return Object.assign(acc, { endRow: pos.row, endColumn: pos.column });
                }
            }, null);
    })
    .mergeAll();

const doubleClick$ = click$
    .bufferCount(2, 1)
    .filter(([e1, e2]) => e1.target.id === e2.target.id)
    .map(([e]) => e);

dragDrop$.subscribe(renderSelection);
doubleClick$.subscribe((e) => {
    e.target.appendChild(cellInput);
    cellInput.style.removeProperty('display');
    cellInput.setAttribute('value', '');
    cellInput.style.outline = 'none';
    cellInput.focus();
});

function renderSelection(range) {
    const startRow = Math.min(range.startRow, range.endRow);
    const startColumn = Math.min(range.startColumn, range.endColumn);
    const endRow = Math.max(range.startRow, range.endRow);
    const endColumn = Math.max(range.startColumn, range.endColumn);
    const { top, left } = document.getElementById(`cell-${startRow}-${startColumn}`).getBoundingClientRect();
    const { bottom, right } = document.getElementById(`cell-${endRow}-${endColumn}`).getBoundingClientRect();
    const { scrollTop, scrollLeft } = document.documentElement;
    const selectionEl = document.getElementById('selection');
    selectionEl.style.top = `${top + scrollTop - 2}px`;
    selectionEl.style.left = `${left + scrollLeft - 2}px`;
    selectionEl.style.height = `${bottom - top + 3}px`;
    selectionEl.style.width = `${right - left + 3}px`;
}

function renderTable(table) {
    const column = Array(10).fill(false).map((n, i) => i + 1);
    const row = Array(20).fill(false).map((n, i) => i + 1);
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
    table.innerHTML = '';
    table.appendChild(frag);
}

function getPosition(el) {
    return {
        row: parseInt(el.getAttribute('data-row')),
        column: parseInt(el.getAttribute('data-column')),
    };
}

function isPositionEqual(pos1, pos2) {
    return pos1.row === pos2.row && pos1.column === pos2.column;
}