const Rx = require('rxjs');

const table = document.getElementById('main_table');
const mousedown$ = Rx.Observable.fromEvent(table, 'mousedown');
const mousemove$ = Rx.Observable.fromEvent(document, 'mousemove');
const mouseup$ = Rx.Observable.fromEvent(document, 'mouseup');

const dragDrop$ = mousedown$.switchMap(() => mousemove$.takeUntil(mouseup$));

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