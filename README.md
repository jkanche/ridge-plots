## Ridges.js

A JavaScript library to make ridge plots. 

Install the package from [npm](https://www.npmjs.com/package/ridges.js),

```bash
npm install ridges.js
```

The library offers both horizontal and vertical layouts for creating ridge plots. To get started, choose your preferred layout and then instantiate a new visualization object. Customize the visualization state by configuring properties such as titles, selected metrics, the number of ticks, and more. Next, input your data, and render the plot in your desired dimensions!

```js
import { VerticalRidgePlot, HorizontalRidgePlot } from "ridges.js";
import { data } from "./app/data.js";

let vridge = new VerticalRidgePlot(".ridgeline-vertical");
vridge.setState({
    title: "Temperature (vertical layout)",
    xLabel: "months",
    yLabel: "temperature",
    metric: "mean",
    gradient: false
});

vridge.setInput(data);
vridge.render(300, 500);
```

Check out more examples in the [app directory](./app/)!

