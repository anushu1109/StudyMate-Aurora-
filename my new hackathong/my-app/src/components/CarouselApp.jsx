import React, {
  useEffect,
  useRef,
  useState,
  useMemo,
  useCallback,
  useLayoutEffect,
} from "react";

// --- STYLES (Normally in a separate CSS file) ---
const styles = `
  .carousel-app-container {
    color: #fff;
    font-family: 'Inter', sans-serif;
    padding: 2rem 0;
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  .carousel-header {
    text-align: center;
    margin-bottom: 2rem;
    font-size: 2.5rem;
    font-weight: bold;
  }

  .carousel-component {
    position: relative;
    width: 100%;
    max-width: 1600px;
    margin: 0 auto;
  }

  .carousel-wrapper {
    overflow: hidden;
    width: 100%;
    border-radius: 15px; /* Rounded corners for the container */
  }

  .carousel-inner {
    display: flex;
    will-change: transform;
  }

  /* --- MODIFIED MOVIE CARD STYLES --- */

  .movie-card {
    width: 60vw;
    max-width: 700px;
    flex-shrink: 0;
    margin-right: 20px;
    border-radius: 12px;
    overflow: hidden;
    transition: transform 0.3s ease;
    position: relative; /* Required for the content overlay */
    display: flex;
  }

  .movie-card:hover {
    transform: scale(1.02);
  }

  .movie-image {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }
  
  /* NEW: Content overlay for text and subdivisions */
  .card-content {
    position: absolute;
    bottom: 0;
    left: 0;
    width: 100%;
    padding: 1.5rem;
    box-sizing: border-box;
    color: #fff;
    /* Gradient for text readability */
    background: linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0) 100%);
    display: flex;
    flex-direction: column;
    justify-content: flex-end;
    height: 70%; /* Adjust how high the gradient and content go */
  }

  .card-title {
    font-size: 1.8rem;
    font-weight: bold;
    margin: 0 0 0.5rem 0;
  }

  .card-description {
    font-size: 0.9rem;
    margin: 0 0 1rem 0;
    line-height: 1.4;
    color: #e0e0e0;
  }

  /* NEW: Subdivision for genre and rating */
  .card-info {
    display: flex;
    align-items: center;
    gap: 1rem;
    font-size: 0.8rem;
    font-weight: 500;
  }

  .card-genre {
    background-color: rgba(255, 255, 255, 0.1);
    padding: 0.2rem 0.5rem;
    border-radius: 5px;
  }
  
  .card-rating {
    display: flex;
    align-items: center;
    gap: 0.3rem;
  }

  .star-icon {
    width: 14px;
    height: 14px;
    fill: #FFD700; /* Gold color for the star */
  }


  /* --- END OF MOVIE CARD STYLES --- */

  .carousel-btn {
    position: absolute;
    top: 40%;
    transform: translateY(-50%);
    background: rgba(0, 0, 0, 0.6);
    color: #fff;
    border: none;
    font-size: 2.5rem;
    width: 45px;
    height: 45px;
    border-radius: 50%;
    cursor: pointer;
    z-index: 10;
    display: flex;
    align-items: center;
    justify-content: center;
    user-select: none;
    transition: background 0.2s ease;
  }
  .carousel-btn:hover {
    background: rgba(0, 0, 0, 0.9);
  }
  .carousel-btn.prev {
    left: 20px;
  }
  .carousel-btn.next {
    right: 20px;
  }

  .carousel-dots {
    display: flex;
    justify-content: center;
    margin-top: 25px;
    gap: 10px;
  }

  .dot {
    width: 10px;
    height: 10px;
    background: #444;
    border-radius: 50%;
    cursor: pointer;
    transition: background 0.3s, transform 0.3s;
  }
  .dot:hover {
    transform: scale(1.2);
  }
  .dot.active {
    background: #fff;
  }
`;

// --- UPDATED Helper Component: MovieCard ---
function MovieCard({ title, image, description, genre, rating }) {
  return (
    <div className="movie-card">
      <img
        src={image}
        alt={title}
        className="movie-image"
        onError={(e) => {
          e.target.onerror = null;
          e.target.src = "https://placehold.co/800x450/222/FFF?text=Image+Error";
        }}
      />
      {/* This div holds all the text and subdivisions */}
      <div className="card-content">
        <h3 className="card-title">{title}</h3>
        <p className="card-description">{description}</p>
        
        {/* This is the subdivision for extra info */}
        <div className="card-info">
          <span className="card-genre">{genre}</span>
          <div className="card-rating">
            {/* Star Icon SVG */}
            <svg className="star-icon" viewBox="0 0 24 24">
              <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"></path>
            </svg>
            <span>{rating}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// --- Main Carousel Component (No changes needed here) ---
function MovieCarousel({ movies, autoInterval = 5000 }) {
  const wrapperRef = useRef(null);
  const carouselRef = useRef(null);
  const intervalRef = useRef(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [dimensions, setDimensions] = useState({ containerWidth: 0, cardWidth: 0 });
  const [activeIndex, setActiveIndex] = useState(1);

  const extendedMovies = useMemo(() => {
    if (movies.length === 0) return [];
    const first = movies[0];
    const last = movies[movies.length - 1];
    return [last, ...movies, first];
  }, [movies]);

  const totalExtended = extendedMovies.length;
  const totalReal = movies.length;

  const getTransformX = useCallback((index) => {
    if (!dimensions.containerWidth || !dimensions.cardWidth) return 0;
    const containerCenter = dimensions.containerWidth / 2;
    const cardCenter = dimensions.cardWidth / 2;
    const cardLeftEdge = index * dimensions.cardWidth;
    return containerCenter - cardCenter - cardLeftEdge;
  }, [dimensions]);

  const updateDimensions = useCallback(() => {
    if (wrapperRef.current && carouselRef.current && carouselRef.current.children[0]) {
      const container = wrapperRef.current;
      const card = carouselRef.current.children[0];
      const style = window.getComputedStyle(card);
      setDimensions({
        containerWidth: container.offsetWidth,
        cardWidth: card.offsetWidth + parseInt(style.marginRight, 10),
      });
    }
  }, []);

  useLayoutEffect(() => {
    updateDimensions();
    window.addEventListener("resize", updateDimensions);
    return () => window.removeEventListener("resize", updateDimensions);
  }, [updateDimensions]);

  const slideTo = useCallback((index, withAnimation = true) => {
    if (carouselRef.current) {
      if (withAnimation) {
        setIsAnimating(true);
        carouselRef.current.style.transition = "transform 0.5s cubic-bezier(0.86, 0, 0.07, 1)";
      } else {
        carouselRef.current.style.transition = "none";
      }
      const targetX = getTransformX(index);
      carouselRef.current.style.transform = `translateX(${targetX}px)`;
      setActiveIndex(index);
    }
  }, [getTransformX]);

  useEffect(() => {
      if (dimensions.cardWidth > 0) {
        slideTo(activeIndex, false);
      }
  }, [dimensions.cardWidth]);

  const resetAutoPlay = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (autoInterval > 0) {
        intervalRef.current = setInterval(() => {
            setActiveIndex(prevIndex => {
                const nextIndex = prevIndex + 1;
                slideTo(nextIndex);
                return nextIndex;
            });
        }, autoInterval);
    }
  }, [autoInterval, slideTo]);

  const next = useCallback(() => {
    if (isAnimating) return;
    slideTo(activeIndex + 1);
    resetAutoPlay();
  }, [isAnimating, activeIndex, slideTo, resetAutoPlay]);

  const prev = useCallback(() => {
    if (isAnimating) return;
    slideTo(activeIndex - 1);
    resetAutoPlay();
  }, [isAnimating, activeIndex, slideTo, resetAutoPlay]);

  const goTo = useCallback((index) => {
    if (isAnimating) return;
    slideTo(index + 1);
    resetAutoPlay();
  }, [isAnimating, slideTo, resetAutoPlay]);

  const handleTransitionEnd = useCallback(() => {
    setIsAnimating(false);
    let newActiveIndex = activeIndex;
    if (activeIndex <= 0) {
      newActiveIndex = totalReal;
    } else if (activeIndex >= totalExtended - 1) {
      newActiveIndex = 1;
    }

    if (newActiveIndex !== activeIndex) {
      requestAnimationFrame(() => {
        slideTo(newActiveIndex, false);
      });
    }
  }, [activeIndex, totalReal, totalExtended, slideTo]);

  useEffect(() => {
    if (dimensions.cardWidth > 0) {
      resetAutoPlay();
      return () => {
        if (intervalRef.current) clearInterval(intervalRef.current);
      };
    }
  }, [resetAutoPlay, dimensions.cardWidth]);

  if (movies.length === 0) return <div>Loading movies...</div>;

  return (
    <div
      className="carousel-component"
      onMouseEnter={() => clearInterval(intervalRef.current)}
      onMouseLeave={resetAutoPlay}
    >
      <div className="carousel-wrapper" ref={wrapperRef}>
        <div
          className="carousel-inner"
          ref={carouselRef}
          onTransitionEnd={handleTransitionEnd}
        >
          {extendedMovies.map((movie, idx) => (
            <MovieCard 
              key={`${movie.id}-${idx}`} 
              title={movie.title} 
              image={movie.image}
              description={movie.description}
              genre={movie.genre}
              rating={movie.rating}
            />
          ))}
        </div>
      </div>

      <button className="carousel-btn prev" onClick={prev}>&#8249;</button>
      <button className="carousel-btn next" onClick={next}>&#8250;</button>

      <div className="carousel-dots">
        {movies.map((_, idx) => {
          const realActiveIndex = (activeIndex - 1 + totalReal) % totalReal;
          return (
            <div
              key={idx}
              className={`dot ${realActiveIndex === idx ? "active" : ""}`}
              onClick={() => goTo(idx)}
            />
          );
        })}
      </div>
    </div>
  );
}

// --- Example Usage ---
export default function App() {
  // UPDATED sample movie data with new fields
  const sampleMovies = [
    { 
      id: 1, 
      title: "Preparing for Viva or Open-Book Tests", 
      image: "https://i.pinimg.com/736x/ba/04/9d/ba049d97eaa9840799f17e27ed8b35eb.jpg",
      description: "the user downloads the Q&A history as a text file for quick revision.",
      genre: "Exam Preparation / Assessment Support",
      rating: "8.8"
    },
    { 
      id: 2, 
      title: "Personalized Self-Paced Learning", 
      image: "https://i.pinimg.com/736x/ec/59/4d/ec594d5b9cd8e8cbc939a8744370d661.jpg",
      description: "This flexibility ensures that learning is tailored to each student’s needs, making it ideal for independent study and long-term knowledge retention.",
      genre: "Adaptive Learning / Self-Learning",
      rating: "9.0"
    },
    { 
      id: 3, 
      title: "Multi-PDF Research Compilation", 
      image: "https://i.pinimg.com/1200x/4e/e6/2c/4ee62c9b4a01dd6a77898647bd8b6cf2.jpg",
      description: "This flexibility ensures that learning is tailored to each student’s needs, making it ideal for independent study and long-term knowledge retention.",
      genre: "Research & Knowledge Management",
      rating: "8.6"
    },
    { 
      id: 4, 
      title: "Studying from Digital Textbooks", 
      image: "https://i.pinimg.com/736x/5d/e6/31/5de63102937d14a8350c852d3bf689be.jpg",
      description: "This scenario enhances learning by providing answers strictly grounded in the student’sown material.",
      genre: "Digital Learning / E-Learnin",
      rating: "8.7"
    },
    { 
      id: 5, 
      title: "Concept Clarification During Study", 
      image: "https://i.pinimg.com/736x/b7/a7/25/b7a7250f8a2817419bb84621888648be.jpg",
      description: "This enables the student to get accurate help instantly without breaking their concentration to skim through pages.",
      genre: "Academic Support / Learning Assistance",
      rating: "8.6"
    },
  ];

  return (
    <>
      <style>{styles}</style>
      <div className="carousel-app-container">
        <MovieCarousel movies={sampleMovies} />
      </div>
    </>
  );
}