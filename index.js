const Rx = require('rxjs');

const table = document.getElementById('main_table');
const mousedown$ = Rx.Observable.fromEvent(table, 'mousedown');
const mousemove$ = Rx.Observable.fromEvent(document, 'mousemove');
const mouseup$ = Rx.Observable.fromEvent(document, 'mouseup');

const dragDrop$ = mousedown$.switchMap(() => mousemove$.takeUntil(mouseup$));

renderTable(table);

mousedown$
    .filter(e => e.target.nodeName === 'TD')
    .subscribe(e => {
        table.querySelectorAll('td').forEach(cell => {cell.className = '';});
        e.target.className = 'selected';
        dragDrop$
            .filter(e => e.target.nodeName === 'TD')
            .subscribe(e => {
                e.target.className = 'selected';
            });
    });

function renderTable(table) {
    const column = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];
    const row = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
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