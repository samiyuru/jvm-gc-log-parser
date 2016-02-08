var lineReader = require('line-reader');
var LineReaderSync = require("line-reader-sync");

var gcFilePath = process.argv[2];
var rangeFilePath = process.argv[3];
var validLine = new RegExp(/^[0-9]{4}.*$/);
var groupMatch = new RegExp(/^(.{19}).*\s+([0-9]*)K\->([0-9]*)K.*$/);
var dateGroup = new RegExp(/^.*\s+([a-zA-Z]{3})\s+([0-9]+)\s+([0-9]{2}:[0-9]{2}:[0-9]{2}).*\s+([0-9]{4})/);
var months = {
    "Jan":"01",
    "Feb":"02",
    "Mar":"03",
    "Apr":"04",
    "May":"05",
    "Jun":"06",
    "Jul":"07",
    "Aug":"08",
    "Sep":"09",
    "Oct":"10",
    "Nov":"11",
    "Dec":"12"
};

var ranges = []; //[{start:, end:, avg:, min:, max:}]
var lrs = new LineReaderSync(rangeFilePath);
while(true){
      var start = lrs.readline();
      var end = lrs.readline();
      if(start === null || end === null){
            break;
      }
      var groups = dateGroup.exec(start);
      var startTime = dateString(groups[4], groups[1], groups[2], groups[3]);
      groups = dateGroup.exec(end);
      var endTime = dateString(groups[4], groups[1], groups[2], groups[3]);
      groups = dateGroup.exec(end);
      ranges.push({
            total:0,
            count:0,
            avg:0,
            min:Number.MAX_VALUE,
            max:0,
            start:Date.parse(startTime),
            end:Date.parse(endTime),
            add:function(val){
                var valNum = parseInt(val);
                this.total += parseInt(valNum);
                this.count++;
                this.avg = this.total / this.count;
                if(val < this.min){
                    this.min = valNum;
                }
                if(val > this.max){
                    this.max = valNum;
                }
            }
      });
}

lineReader.eachLine(gcFilePath, function(line, last) {
    if(validLine.test(line)){
        //console.log(line);
        var groups = groupMatch.exec(line);
        //console.log(groups);
        var date = Date.parse(groups[1]);
        //console.log("GC date: " + date);
        var memFrom = groups[2];
        var memTo = groups[3];
        for(var i in ranges){
            var range = ranges[i];
            if(range.start < date && date <= range.end){
                //console.log("In range" + range.start + " " + date + " " + range.end);
                range.add(memFrom);
                range.add(memTo);
                break;
            }
        }
    }
    if(last){
        console.log("min(K) \tmax(K) \tavg(K)");
        console.log("-----------------------------------");
        for(var i in ranges){
            var range = ranges[i];
            console.log(range.start + "-" + range.end);
            console.log(range.min + "\t" + range.max +"\t" + Math.round(range.avg) +"" /*+ "\t" + range.total + "\t" + range.count*/);
            console.log("-----------------------------------");
        }
        console.log("");
        console.log("Min (K)");
        console.log("-----------------------------------");
        for(var i in ranges){
            var range = ranges[i];
            console.log(range.min);
        }
        console.log("");
        console.log("Max (K)");
        console.log("-----------------------------------");
        for(var i in ranges){
            var range = ranges[i];
            console.log(range.max);
        }
        console.log("");
        console.log("Avg (K)");
        console.log("-----------------------------------");
        for(var i in ranges){
            var range = ranges[i];
            console.log(Math.round(range.avg));
        }
    }
});

function formatTwoDigit(val){
    return (parseInt(val) < 10)? "0"+val : val;
}

function dateString(year, month, date, time){
     var monthNum = months[month];
     var date = formatTwoDigit(date);
     return year+"-"+monthNum+"-"+date+"T"+time;
}