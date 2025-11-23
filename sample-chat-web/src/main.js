import "./style.css";

document.querySelector("#app").innerHTML = `
  <div class="container">
    <header class="header">
      <div class="logo">WealthBridge Financial</div>
      <nav class="nav">
        <a href="#services">Services</a>
        <a href="#about">About</a>
        <a href="#contact">Contact</a>
      </nav>
    </header>

    <div class="hero">
      <h1>Build Your Financial Future</h1>
      <p class="subtitle">Expert investment advisory and wealth management services tailored to your goals</p>
      <div class="cta-buttons">
        <button class="btn btn-primary">Get Started</button>
        <button class="btn btn-secondary">Learn More</button>
      </div>
    </div>

    <section class="features">
      <div class="feature-card">
        <div class="feature-icon">📊</div>
        <h3>Portfolio Management</h3>
        <p>Diversified investment strategies designed to maximize returns while managing risk</p>
      </div>
      <div class="feature-card">
        <div class="feature-icon">💼</div>
        <h3>Retirement Planning</h3>
        <p>Comprehensive retirement planning to secure your financial independence</p>
      </div>
      <div class="feature-card">
        <div class="feature-icon">📈</div>
        <h3>Market Analysis</h3>
        <p>Real-time market insights and data-driven investment recommendations</p>
      </div>
    </section>

    <section class="stats">
      <div class="stat-item">
        <div class="stat-number">$2.5B+</div>
        <div class="stat-label">Assets Under Management</div>
      </div>
      <div class="stat-item">
        <div class="stat-number">15,000+</div>
        <div class="stat-label">Happy Clients</div>
      </div>
      <div class="stat-item">
        <div class="stat-number">25+</div>
        <div class="stat-label">Years of Experience</div>
      </div>
    </section>

    <footer class="footer">
      <p>Have questions? Chat with our AI financial advisor using the chat widget!</p>
      <p class="footer-note">© 2024 WealthBridge Financial. All rights reserved.</p>
    </footer>
  </div>
`;
