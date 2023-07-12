"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Chrono = void 0;
const jsUtils_js_1 = require("./jsUtils.js");
const ramdaExt_js_1 = require("./ramdaExt.js");
const table_js_1 = require("./table/table.js");
const text_js_1 = require("./table/components/text.js");
const timeline_js_1 = require("./table/components/timeline.js");
let myGlobal = typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : typeof this !== 'undefined' ? this : {};
let performance = myGlobal === null || myGlobal === void 0 ? void 0 : myGlobal.performance;
if (performance === undefined) {
    try {
        performance = (await Promise.resolve().then(() => __importStar(require('perf_hooks')))).performance;
    }
    catch (e) { }
}
if (performance === undefined)
    performance = {};
// needed only for debuging
//import { RE } from './ramdaExt.js';
function Chrono() {
    let milisecondsNow;
    if (performance === null || performance === void 0 ? void 0 : performance.now)
        milisecondsNow = () => performance.now();
    if (milisecondsNow === undefined)
        milisecondsNow = () => Date.now();
    let historyTimeIntervals = {};
    let chronoEvents = {};
    createTimeEvent('chronoCreation');
    let rangeType = Range({
        type: 'miliseconds',
        displayFormat: 'ms',
        referenceMiliseconds: chronoEvents['chronoCreation'].miliseconds
    });
    function createTimeEvent(eventName) {
        chronoEvents[eventName] = {
            date: new Date(),
            miliseconds: milisecondsNow()
        };
    }
    function validateEventName(eventName) {
        if (typeof eventName !== 'string' || isNaN(Number(eventName)) === false)
            throw new jsUtils_js_1.CustomError('EVENT_NAME_MUST_HAVE_ALPHABETICS_CHARS', `Event name '${eventName}' must be of type string and contain some non numeric character`, eventName);
    }
    function time(eventNames) {
        let currentMiliseconds = milisecondsNow();
        let listOfEvents = typeof eventNames === 'string'
            ? [eventNames]
            : eventNames;
        listOfEvents.forEach(eventName => {
            var _a, _b;
            var _c;
            validateEventName(eventName);
            (_a = historyTimeIntervals[eventName]) !== null && _a !== void 0 ? _a : (historyTimeIntervals[eventName] = {});
            (_b = (_c = historyTimeIntervals[eventName]).start) !== null && _b !== void 0 ? _b : (_c.start = []);
            historyTimeIntervals[eventName].start.push(currentMiliseconds);
        });
    }
    function timeEnd(eventNames) {
        let currentMiliseconds = milisecondsNow();
        let listOfEvents = typeof eventNames === 'string'
            ? [eventNames]
            : eventNames;
        listOfEvents.forEach(eventName => {
            var _a;
            var _b;
            if (historyTimeIntervals[eventName] === undefined) {
                throw new jsUtils_js_1.CustomError('EVENT_NAME_NOT_FOUND', `No such Label '${eventName}' for .timeEnd(...)`, eventName);
            }
            let start = historyTimeIntervals[eventName].start.pop();
            if (start === undefined) {
                throw new jsUtils_js_1.CustomError('EVENT_NAME_ALREADY_CONSUMED', `eventName: '${eventName}' was already consumed by a previous call to .timeEnd(...)`, eventName);
            }
            (_a = (_b = historyTimeIntervals[eventName]).ranges) !== null && _a !== void 0 ? _a : (_b.ranges = []);
            historyTimeIntervals[eventName].ranges.push(rangeType(start, currentMiliseconds));
        });
    }
    function fillWithUndefinedRanges() {
        Object.entries(historyTimeIntervals).forEach(([eventName, currentEventValues], indexEvent, intervalEntries) => {
            let indexRangeForEvent = 0;
            intervalEntries[0][1].ranges.forEach(({ start: startRef, end: endRef }, indexRangeRef) => {
                if (indexEvent === 0) {
                    currentEventValues.ranges[indexRangeRef] = rangeType(startRef, endRef, indexRangeRef);
                    return;
                }
                const isCurrentEventSameIntervalAsReference = () => {
                    var _a, _b;
                    const currentEventStart = (_a = currentEventValues.ranges[indexRangeForEvent]) === null || _a === void 0 ? void 0 : _a.start;
                    const nextEventStart = (_b = intervalEntries[0][1].ranges[indexRangeRef + 1]) === null || _b === void 0 ? void 0 : _b.start;
                    const isStartOfCurrentEventAfterStartOfReference = currentEventStart >= startRef;
                    const isStartOfCurrentEventBeforeStartOfNextReference = indexRangeRef + 1 === intervalEntries[0][1].ranges.length
                        || currentEventStart < nextEventStart;
                    return isStartOfCurrentEventAfterStartOfReference
                        && isStartOfCurrentEventBeforeStartOfNextReference;
                };
                let foundMatchingInterval = false;
                while (isCurrentEventSameIntervalAsReference()) {
                    foundMatchingInterval = true;
                    const currentRange = currentEventValues.ranges[indexRangeForEvent];
                    const nextRange = currentEventValues.ranges[indexRangeForEvent + 1];
                    const previousRange = currentEventValues.ranges[indexRangeForEvent - 1];
                    // Accrued ranges for same interval, deleting the current one
                    const isSameIntervalAsPreviousOne = (previousRange === null || previousRange === void 0 ? void 0 : previousRange.interval) === indexRangeRef;
                    if (isSameIntervalAsPreviousOne) {
                        currentEventValues.ranges[indexRangeRef] =
                            rangeType(currentRange.start - (previousRange.end - previousRange.start), currentRange.end, indexRangeRef);
                        currentEventValues.ranges.splice(indexRangeForEvent, 1);
                    }
                    else {
                        currentEventValues.ranges[indexRangeForEvent] =
                            rangeType(currentRange.start, currentRange.end, indexRangeRef);
                        indexRangeForEvent++;
                    }
                }
                if (foundMatchingInterval === false) {
                    (0, jsUtils_js_1.pushAt)(indexRangeForEvent, rangeType(undefined, undefined, indexRangeRef), currentEventValues.ranges);
                    indexRangeForEvent++;
                }
            });
        });
    }
    function findParentRanges(eventValues, indexEvent, intervalEntries) {
        let isNotAParent = true;
        while (indexEvent !== 0 && isNotAParent === true) {
            indexEvent--;
            isNotAParent = intervalEntries[indexEvent][1].ranges.some(({ start, end }, index) => (start === undefined || end === undefined) &&
                (eventValues.ranges[index].start !== undefined || eventValues.ranges[index].end !== undefined));
        }
        return [intervalEntries[indexEvent][1].ranges, intervalEntries[indexEvent][0]];
    }
    //TDL
    function average() {
        fillWithUndefinedRanges();
        historyTimeIntervals = Object.entries(historyTimeIntervals).reduce((newHistoryIntervals, [eventName, eventValues], indexEvent, intervalEntries) => {
            const [parentRanges, parentEventName] = findParentRanges(eventValues, indexEvent, intervalEntries);
            const [totalElapse, totalEndToStartGap, totalStartToStartGap] = eventValues.ranges.reduce(([totalElapse, totalEndToStartGap, totalStartToStartGap], { start = 0, end = 0 }, indexRange) => {
                totalElapse = totalElapse + end - start;
                if (indexEvent !== 0 && start !== 0 && end !== 0) {
                    totalEndToStartGap = totalEndToStartGap + start - parentRanges[indexRange].end;
                    totalStartToStartGap = totalStartToStartGap + start - parentRanges[indexRange].start;
                }
                return [
                    totalElapse,
                    totalEndToStartGap,
                    totalStartToStartGap
                ];
            }, [0, 0, 0]);
            let averagetart;
            let avarageEventEnd;
            const totalRangesWithValues = eventValues.ranges.filter(({ start, end }) => start !== undefined & end !== undefined).length;
            if (indexEvent === 0) {
                averagetart = intervalEntries[0][1].ranges[0].start;
            }
            if (indexEvent !== 0 && Math.abs(totalEndToStartGap) <= Math.abs(totalStartToStartGap)) {
                averagetart =
                    newHistoryIntervals[parentEventName].ranges[0].end +
                        totalEndToStartGap / totalRangesWithValues;
            }
            if (indexEvent !== 0 && Math.abs(totalStartToStartGap) < Math.abs(totalEndToStartGap)) {
                averagetart =
                    newHistoryIntervals[parentEventName].ranges[0].start +
                        totalStartToStartGap / eventValues.ranges.length;
            }
            avarageEventEnd = averagetart + totalElapse / eventValues.ranges.length;
            newHistoryIntervals[eventName] =
                {
                    ranges: [
                        rangeType(averagetart, avarageEventEnd, 0)
                    ]
                };
            return newHistoryIntervals;
        }, {});
        //range: { start:3.5852760076522827 <-133.67405599355698-> end:137.25933200120926 }
    }
    function eventsReport(events) {
        const entriesEvents = Object.entries(events);
        const [minMilisecondss, maxMilisecondss] = entriesEvents.reduce((acum, [eventName, eventObject]) => {
            eventObject.ranges.forEach(range => {
                if (acum[0] > range.start)
                    acum[0] = range.start;
                if (acum[1] < range.end)
                    acum[1] = range.end;
            });
            return acum;
        }, [Infinity, 0]);
        return events;
    }
    function totalEventsElapseTimeReport(events) {
        let totalElapse = 0;
        const toLog = events.reduce((acum, current) => {
            let found = acum.find(el => el.name === current.name);
            const currentElapseMs = current.range.end - current.range.start;
            totalElapse = totalElapse + currentElapseMs;
            if (found)
                found.elapse = found.elapse + currentElapseMs;
            else
                acum.push({ name: current.name, elapse: currentElapseMs });
            return acum;
        }, []).map(nameRange => {
            nameRange.percentage = Number(Number(100 * nameRange.elapse / totalElapse).toFixed(2));
            nameRange.elapse = Math.floor(nameRange.elapse);
            return nameRange;
        });
        console.log('');
        console.log('Total elapse Time of each event: ');
        (0, table_js_1.consoleTable)(toLog);
        return events;
    }
    function coincidingEventsReport(elapseTable) {
        ramdaExt_js_1.R.pipe((0, ramdaExt_js_1.groupByWithCalc)((row) => JSON.stringify(row.runningEvents.sort((0, jsUtils_js_1.arraySorter)())), { percentage: (l, r) => (l !== null && l !== void 0 ? l : 0) + r, elapseMs: (l, r) => (l !== null && l !== void 0 ? l : 0) + r }), ramdaExt_js_1.R.map(row => (Object.assign(Object.assign({}, row), { elapseMs: Math.floor(row.elapseMs), percentage: Number(row.percentage.toFixed(2)) }))), (coincidingEvents) => {
            console.log('');
            console.log('Coinciding Events timeline: ');
            (0, table_js_1.consoleTable)(coincidingEvents);
        })(elapseTable);
        return elapseTable;
    }
    function logTimeline(timeline) {
        console.log('');
        console.log('Timeline of events:');
        console.log(timeline.draw());
    }
    function createTimeline(data) {
        const timeline = (0, table_js_1.Table)(data);
        timeline.addColumn({ type: (0, text_js_1.Text)(), id: 'event', title: 'Events' });
        timeline.addColumn({ type: (0, timeline_js_1.Timeline)(), id: 'ranges' });
        return timeline;
    }
    function formatReportAndReturnInputParam(data) {
        let toReport = Object.entries(data).map(([eventName, event]) => ({
            event: eventName,
            ranges: event.ranges.map(({ start, end }) => ({ start: Math.floor(start), end: Math.floor(end) }))
        }));
        const toLog = createTimeline(toReport);
        logTimeline(toLog);
        return data;
    }
    function timelineLines() {
        let toReport = Object.entries(historyTimeIntervals).map(([eventName, event]) => ({
            event: eventName,
            ranges: event.ranges.map(({ start, end }) => ({ start: Math.floor(start), end: Math.floor(end) }))
        }));
        return createTimeline(toReport).draw();
    }
    function chronoReport() {
        console.log('');
        Object.entries(chronoEvents).forEach(([key, value]) => console.log(key, ': ', value.date));
    }
    function report() {
        createTimeEvent('report');
        chronoReport();
        ramdaExt_js_1.R.pipe(
        //RE.RLog('0-->: '),
        formatReportAndReturnInputParam, eventsReport, historyToListOfNameRanges, 
        //RE.RLog('1-->: '),
        totalEventsElapseTimeReport, 
        //RE.RLog('2-->: '),
        compactListOfNameRanges, 
        //RE.RLog('3-->: '),
        ramdaExt_js_1.R.sort((0, jsUtils_js_1.sorterByPaths)('range.start')), reportListOfNameRanges, 
        //RE.RLog('4-->: '),
        coincidingEventsReport)(historyTimeIntervals);
    }
    function historyToListOfNameRanges(historyTimeIntervals) {
        return Object.entries(historyTimeIntervals)
            .reduce((acum, [key, value]) => {
            var _a, _b;
            acum.push(...(_b = ((_a = value.ranges) === null || _a === void 0 ? void 0 : _a.map(range => ({ name: key, range })))) !== null && _b !== void 0 ? _b : []);
            return acum;
        }, []);
    }
    function compactListOfNameRanges(ListOfRangeNames) {
        return ListOfRangeNames.reduce((acum, { name, range }) => {
            acum.push({ name, isLeft: true, edge: range.start, edgeEnd: range.end });
            acum.push({ name, isLeft: false, edge: range.end });
            return acum;
        }, [])
            .sort((0, jsUtils_js_1.sorterByPaths)('edge'))
            .reduce((acum, { name, isLeft, edge, edgeEnd }, index, table) => {
            if (isLeft) {
                let i = index;
                do {
                    (0, jsUtils_js_1.pushUniqueKeyOrChange)({ runningEvents: [name], range: rangeType(table[i].edge, table[i + 1].edge) }, acum, ['range'], (newRow, existingRow) => {
                        (0, jsUtils_js_1.pushUniqueKey)(name, existingRow.runningEvents);
                        return existingRow;
                    });
                    i++;
                } while (!(table[i].name === name && table[i].isLeft === false && table[i].edge === edgeEnd));
            }
            return acum;
        }, []).filter(elem => elem.range.start !== elem.range.end);
    }
    function reportListOfNameRanges(listOfNameRanges) {
        let totalElapse = 0;
        return listOfNameRanges.map(({ runningEvents, range }) => {
            let elapseMs = milisecondsRangeToElapseMs(range);
            totalElapse = totalElapse + elapseMs;
            return {
                runningEvents,
                elapseMs
            };
        }).map(nameRange => {
            nameRange.percentage = 100 * nameRange.elapseMs / totalElapse;
            return nameRange;
        });
    }
    const setTime = event => data => {
        time(event);
        return data;
    };
    const setTimeEnd = event => data => {
        timeEnd(event);
        return data;
    };
    const logReport = data => {
        report();
        return data;
    };
    const getChronoState = () => historyTimeIntervals;
    const setChronoStateUsingPerformanceAPIFormat = (performanceGetEntriesByTypeOjb) => {
        historyTimeIntervals =
            performanceGetEntriesByTypeOjb.reduce((historyAcum, { name, startTime, duration, entryType }) => {
                var _a, _b, _c, _d;
                var _e, _f;
                validateEventName(name);
                if (entryType === 'mark') {
                    (_a = historyAcum[name]) !== null && _a !== void 0 ? _a : (historyAcum[name] = {});
                    (_b = (_e = historyAcum[name]).start) !== null && _b !== void 0 ? _b : (_e.start = []);
                    historyAcum[name].start.push(startTime);
                }
                if (entryType === 'measure') {
                    (_c = historyAcum[name]) !== null && _c !== void 0 ? _c : (historyAcum[name] = {});
                    (_d = (_f = historyAcum[name]).ranges) !== null && _d !== void 0 ? _d : (_f.ranges = []);
                    historyAcum[name].ranges.push(rangeType(startTime, startTime + duration));
                }
                return historyAcum;
            }, {});
    };
    const getChronoStateUsingPerformanceAPIFormat = () => {
        return Object.entries(historyTimeIntervals).reduce((performanceAPIFormatAcum, [eventName, eventValue]) => {
            var _a, _b;
            (_a = eventValue.start) === null || _a === void 0 ? void 0 : _a.forEach(start => performanceAPIFormatAcum.push({
                duration: 0,
                startTime: start,
                name: eventName,
                entryType: 'mark'
            }));
            (_b = eventValue.ranges) === null || _b === void 0 ? void 0 : _b.forEach(range => performanceAPIFormatAcum.push({
                duration: range.end - range.start,
                startTime: range.start,
                name: eventName,
                entryType: 'measure'
            }));
            return performanceAPIFormatAcum;
        }, []);
    };
    function reset() {
        historyTimeIntervals = {};
        chronoEvents = { chronoCreation: chronoEvents['chronoCreation'] };
    }
    return {
        time, timeEnd, report, setTime, setTimeEnd, logReport, timelineLines,
        getChronoState, setChronoStateUsingPerformanceAPIFormat, getChronoStateUsingPerformanceAPIFormat, average,
        reset
    };
}
exports.Chrono = Chrono;
function milisecondsRangeToElapseMs({ start, end }) {
    return end - start;
}
function Range(...params) {
    let type;
    let displayFormat;
    let referenceMiliseconds;
    if (params.length >= 2) {
        return range(...params);
    }
    else {
        ({ type, displayFormat, referenceMiliseconds } = params[0]);
        return range;
    }
    function range(start, end, interval) {
        //console.log(interval) 
        if (start > end)
            throw new Error('range(start, end) start cannot be > than end');
        function toString() {
            if (type === 'miliseconds' && displayFormat === 'ms' && referenceMiliseconds !== undefined) {
                const startMs = milisecondsRangeToElapseMs({ start: referenceMiliseconds, end: start });
                const endMs = milisecondsRangeToElapseMs({ start: referenceMiliseconds, end });
                return `${'interval: ' + interval} { start:${startMs} <-${endMs - startMs}-> end:${endMs} }`;
            }
            return `{ start:${start}, end:${end} }`;
        }
        function intersect(rangeB) {
            let newStart = start > rangeB.start ? start : rangeB.start;
            let newEnd = end < rangeB.end ? end : rangeB.end;
            if (newStart === undefined || newEnd === undefined)
                return range(undefined, undefined);
            if (newStart > newEnd)
                return range(undefined, undefined);
            return range(newStart, newEnd);
        }
        return {
            [Symbol.for('nodejs.util.inspect.custom')]: toString,
            toString,
            intersect,
            start,
            end,
            interval
        };
    }
}
