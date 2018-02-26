const Rx = require('rxjs');
const io = require('socket.io-client/dist/socket.io.js');
const socket = io();

const table = document.getElementById('main_table');
const cellInput = document.getElementById('cell_input');
const board = document.getElementById('board');
const mousedown$ = Rx.Observable.fromEvent(table, 'mousedown').filter(e => e.target.nodeName === 'TD');
const mousemove$ = Rx.Observable.fromEvent(document, 'mousemove').filter(e => e.target.nodeName === 'TD');
const mouseup$ = Rx.Observable.fromEvent(document, 'mouseup');
const click$ = Rx.Observable.fromEvent(table, 'click').filter(e => e.target.nodeName === 'TD');
const change$ = Rx.Observable.fromEvent(cellInput, 'blur');
const keyDown$ = Rx.Observable.fromEvent(table, 'keydown').filter(e => e.target.nodeName === 'TD');

const ROW_COUNT = 20, COLUMN_COUNT = 10;
const data = Array(ROW_COUNT).fill(false).map(() => Array(COLUMN_COUNT).fill(false));
const tableFrame$ = Rx.Observable.of([ROW_COUNT, COLUMN_COUNT]);

const dataSync$ = Rx.Observable.fromEvent(socket, 'sync');
const uidChange$ = Rx.Observable.fromEvent(socket, 'uid');

const selection$ = mousedown$
    .switchMap((e) => mousemove$
        .takeUntil(mouseup$)
        .map(e => getPosition(e.target))
        .distinctUntilChanged((p, q) => isPositionEqual(p, q))
        .scan((acc, pos) => {
            if (!acc) {
                return { startRow: pos.row, startColumn: pos.column, endRow: pos.row, endColumn: pos.column };
            } else {
                return Object.assign(acc, { endRow: pos.row, endColumn: pos.column });
            }
        }, null)
    )
    .map((range) => {
        return {
            startRow: Math.min(range.startRow, range.endRow),
            startColumn: Math.min(range.startColumn, range.endColumn),
            endRow: Math.max(range.startRow, range.endRow),
            endColumn: Math.max(range.startColumn, range.endColumn),
        };
    });

const doubleClick$ = click$
    .bufferCount(2, 1)
    .filter(([e1, e2]) => e1.target.id === e2.target.id)
    .map(([e]) => e);

const cellChange$ = change$
    .filter(e => e.target.parentNode !== document.body)
    .map(e => Object.assign(getPosition(e.target.parentNode), {
        value: e.target.value,
    }));

tableFrame$.subscribe(renderTable);
selection$.subscribe(renderSelection);
doubleClick$.merge(keyDown$).subscribe(renderInput);
cellChange$.subscribe(cell => {
    socket.emit('edit', cell);
    changeInputState();
    data[cell.row - 1][cell.column - 1] = cell.value;
    renderData(data);
});
dataSync$.subscribe(cell => {
    data[cell.row - 1][cell.column - 1] = cell.value;
    renderData(data);
});
uidChange$.subscribe(uid => {
    board.textContent = `当前${uid}名用户正在编辑`;
});

function renderData(data) {
    data.forEach((columns, i) => {
        const rowIndex = i + 1;
        columns.forEach((v, j) => {
            const columnIndex = j + 1;
            const cellEl = document.getElementById(`cell-${rowIndex}-${columnIndex}`);
            const oldV = cellEl.querySelector('span').textContent;
            if (v !== '' && !v) {
                return;
            }
            if (v === oldV) {
                return;
            }
            cellEl.querySelector('span').textContent = v;
        });
    });
}

function changeInputState(e) {
    cellInput.style.display = 'none';
}

function renderInput(e) {
    const text = e.target.querySelector('span').textContent;
    e.target.querySelector('span').textContent = '';
    e.target.appendChild(cellInput);
    cellInput.style.removeProperty('display');
    cellInput.value = text;
    cellInput.focus();
}

function renderSelection(range) {
    const {startRow, startColumn, endRow, endColumn} = range;
    const { top, left } = document.getElementById(`cell-${startRow}-${startColumn}`).getBoundingClientRect();
    const { bottom, right } = document.getElementById(`cell-${endRow}-${endColumn}`).getBoundingClientRect();
    const scrollTop = document.documentElement.scrollTop || document.body.scrollTop;
    const scrollLeft = document.documentElement.scrollLeft || document.body.scrollLeft;
    const selectionEl = document.getElementById('selection');
    selectionEl.style.top = `${top + scrollTop - 2}px`;
    selectionEl.style.left = `${left + scrollLeft - 2}px`;
    selectionEl.style.height = `${bottom - top + 3}px`;
    selectionEl.style.width = `${right - left + 3}px`;
}

function renderTable([rowCount, columnCount]) {
    const frag = document.createDocumentFragment();
    
    for (let i = 0; i < rowCount; i++) {
        const rowIndex = i + 1;
        const tr = document.createElement('tr');
        tr.id = 'row-' + rowIndex;
        for (let j = 0; j < columnCount; j++) {
            const columnIndex = j + 1;
            const td = document.createElement('td');
            td.id = `cell-${rowIndex}-${columnIndex}`;
            td.setAttribute('data-row', rowIndex);
            td.setAttribute('data-column', columnIndex);
            td.setAttribute('tabindex', 0);
            td.appendChild(document.createElement('span'));
            tr.appendChild(td);
        }
        frag.appendChild(tr);
    }
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